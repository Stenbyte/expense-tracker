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
        actionsList[command][actionKey](expenses, options.id, options.options);
        break;
      case "delete":
        actionsList[command][actionKey](expenses, options.id);
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
  const getMonth = created.getMonth();

  const getBudgetForCurrentMonth = budget.find((b) => b[getMonth + 1]);
  const getBudgetForYear = budget.find((b) => b["year"]);

  if (
    (getBudgetForCurrentMonth &&
      getBudgetForCurrentMonth[getMonth + 1] < Number(amount)) ||
    (getBudgetForYear && getBudgetForYear["year"] < Number(amount))
  ) {
    console.log(
      `Amount is too big, you have exeeded your limit. Please check your ${
        getBudgetForCurrentMonth ? getMonth + 1 + " month" : "year"
      } budget`
    );
    return;
  }

  const newExpense = {
    id: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
    name,
    amount: `$${amount}`,
    category: category || "",
    created,
  };
  expenses.push(newExpense);
  await recordData(expenses);
  console.log("Expense added:", newExpense);
}

export async function updateExpense(expenses, id, options) {
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

  await recordData(expenses);
  console.log("Expense updated:", expenses[existingExpenseIndex]);
}

async function deleteExpense(expenses, id) {
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
  await recordData(filteredExpenses);
  console.log(`Expense deleted with id: ${id}`);
}

async function setBudget(month, amount, budgetList) {
  const budget = {};
  if ((month && !Number(month)) || (amount && !Number(amount))) {
    console.log("Options must be type of number");
    return;
  }
  budget[month ? month : "year"] = Number(amount);

  // i need to check if current budget month year exist and update amount
  budgetList[month ? month : "year"] = { year: amount };

  await recordData(budgetList, true);
  console.log(
    `Budget has been set for ${month ? month : "year"}. Amount: ${amount}`
  );
}
