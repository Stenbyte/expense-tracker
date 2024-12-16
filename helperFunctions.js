import { create } from "domain";
import fs from "fs-extra";
import path from "path";

const EXPENSES_FILE = path.join("expenses.json");
const BUDGET_FILE = path.join("budget.json");

export const processCommand = async (command, options) => {
  const expenses = await getData();
  const budget = await getData(true);
  const listActions = {
    summary: () => handleSummary(expenses),
    all: () => handleAll(expenses),
    month: () => handleByMonthAndYear(expenses, options),
    category: () => handleByCategory(expenses, options),
  };

  const actionsList = {
    list: listActions,
    add: { addNewExpense },
    update: { updateExpense },
    delete: { deleteExpense },
    budget: { setBudget },
  };

  Object.keys(actionsList[command]).forEach((actionKey) => {
    switch (command) {
      case "list":
        if (options[actionKey]) {
          actionsList[command][actionKey]();
        }
        break;
      case "add":
        actionsList[command][actionKey](
          expenses,
          options.name,
          options.amount,
          options.category,
          budget
        );
        break;
      case "update":
        actionsList[command][actionKey](
          expenses,
          options.id,
          options.options,
          budget
        );
        break;
      case "delete":
        actionsList[command][actionKey](expenses, options.id, budget);
        break;
      case "budget":
        actionsList[command][actionKey](options.month, options.amount, budget);
        break;
    }
  });
};

const handleSummary = (expenses) => {
  let summary = 0;
  expenses.forEach((expense) => {
    let amount = Number(expense.amount.slice(1));
    summary = summary + amount;
  });
  console.log(summary, "Summary");
};

const handleAll = (expenses) => {
  console.table(expenses);
};

const handleByMonthAndYear = (expenses, options) => {
  const month = parseInt(options.month);
  const year = options.year ? parseInt(options.year) : new Date().getFullYear();

  if (!month || month < 1 || month > 12) {
    console.error("+++++Please provide a valid month (1-12).+++++++");
    return;
  }

  const totalAmount = summarizeExpensensesByMonth(expenses, month - 1, year);

  console.log(`Expenses for given ${month} ${totalAmount} in a year ${year}`);
};

function summarizeExpensensesByMonth(expenses, targetMonth, targetYear) {
  const filteredExpensesByMonthAndYear = expenses.filter((expense) => {
    const createdDate = new Date(expense.created);

    return (
      createdDate.getMonth() === targetMonth &&
      createdDate.getFullYear() === targetYear
    );
  });

  const totalAmount = filteredExpensesByMonthAndYear.reduce((sum, expense) => {
    return sum + (Number(expense.amount.slice(1)) || 0);
  }, 0);

  return totalAmount;
}

function handleByCategory(expenses, options) {
  const filteredByCategory = expenses.filter(
    (expense) => expense.category === options.category.toLowerCase()
  );
  console.table(filteredByCategory);
}

export async function getData(getBudget) {
  try {
    return await fs.readJSON(getBudget ? BUDGET_FILE : EXPENSES_FILE);
  } catch {
    return [];
  }
}

export async function recordData(dataToRecord, setBudget) {
  if (EXPENSES_FILE || BUDGET_FILE) {
    await fs.writeJSON(setBudget ? BUDGET_FILE : EXPENSES_FILE, dataToRecord, {
      spaces: 2,
    });
  } else {
    const FILE = path.join(
      __dirname,
      setBudget ? "budget.json" : "expenses.json"
    );
    await fs.writeJSON(FILE, dataToRecord, { spaces: 2 });
  }
}

export async function addNewExpense(expenses, name, amount, category, budget) {
  const existingExpense = expenses.find((expense) => expense.name === name);
  if (existingExpense) {
    console.warn(`Expenses name should be unique: ${name}`);
    return;
  }
  const created = new Date();
  const getMonth = created.getMonth() + 1;

  const newExpense = {
    id: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
    name,
    amount: `$${amount}`,
    category: category || "",
    created,
  };
  expenses.push(newExpense);
  recalculateBudget(expenses, budget, newExpense.id);

  await Promise.all([recordData(expenses), recordData(budget, true)]);

  console.log("Expense added:", newExpense);
}

export async function updateExpense(expenses, id, options, budgetList) {
  const existingExpenseIndex = expenses.findIndex(
    (expense) => expense.id === parseInt(id)
  );
  if (existingExpenseIndex === -1) {
    console.warn(`Could not find expense with id: ${id}`);
    return;
  }
  const flagOptions = {
    n: "name",
    a: "amount",
    c: "category",
  };
  Object.entries(flagOptions).forEach(([key, prop]) => {
    if (options[key]) {
      expenses[existingExpenseIndex][prop] =
        key === "a" ? `$${options[key]}` : options[key];
    }
    expenses[existingExpenseIndex].updated = new Date();
  });
  recalculateBudget(expenses, budgetList, id);

  await Promise.all([recordData(expenses), recordData(budgetList, true)]);
  console.log("Expense updated:", expenses[existingExpenseIndex]);
}

async function deleteExpense(expenses, id, budgetList) {
  const existingExpense = expenses.some(
    (expense) => expense.id === parseInt(id)
  );
  if (!existingExpense) {
    console.log(`Could not find expense with id: ${id}`);
    return;
  }

  const filteredExpenses = expenses.filter(
    (expense) => expense.id !== parseInt(id)
  );

  recalculateBudget(expenses, budgetList, id);

  await Promise.all([
    recordData(filteredExpenses),
    recordData(budgetList, true),
  ]);

  console.log(`Expense deleted with id: ${id}`);
}

async function setBudget(month, amount, budgetList) {
  if ((month && !Number(month)) || (amount && !Number(amount))) {
    console.log("Options must be type of number");
    return;
  }
  const budgetKey = month ? month.toString() : "year";
  if (!budgetList.length) budgetList.push({});

  const budget = budgetList[0];

  budget[budgetKey] = Number(amount);

  await recordData(budgetList, true);
  console.log(
    `Budget has been successfully set for ${
      month ? `month ${month}` : "the year"
    }. Amount: ${amount}`
  );
}

function recalculateBudget(expenses, budgetList, id) {
  const getExpense = expenses.find((expense) => expense.id === Number(id));

  const getMonth = new Date(getExpense.created).getMonth() + 1;
  const expenseAmount = parseFloat(getExpense.amount.slice(1));

  budgetList.forEach((budget) => {
    if (budget[getMonth] !== undefined) {
      if (budget[getMonth] < expenseAmount) {
        throw new Error(
          `Monthly budget for month ${getMonth} would go below zero.`
        );
      }
      budget[getMonth] -= expenseAmount;
    }

    if (budget.year !== undefined) {
      if (budget.year < expenseAmount) {
        throw new Error(`Yearly budget would go below zero.`);
      }
      budget.year -= expenseAmount;
    }
  });

  console.log("Budget recalculated successfully:", budgetList);
}
