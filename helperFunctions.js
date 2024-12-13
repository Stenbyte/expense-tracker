import fs from "fs-extra";
import path from "path";

const EXPENSES_FILE = path.join("expenses.json");

export const processListOptions = async (command, options) => {
  const expenses = await getExpenses();
  const listActions = {
    summary: () => handleSummary(expenses),
    all: () => handleAll(expenses),
    month: () => handleByMonthAndYear(expenses, options),
    category: () => handleByCategory(expenses, options),
  };

  const actionsList = {
    list: listActions,
  };

  Object.keys(actionsList[command]).forEach((actionKey) => {
    if (options[actionKey]) {
      actionsList[command][actionKey]();
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

    const yy = createdDate.getMonth();
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

export async function getExpenses() {
  try {
    return await fs.readJSON(EXPENSES_FILE);
  } catch {
    return [];
  }
}

export async function recordExpenses(expenses) {
  if (EXPENSES_FILE) {
    await fs.writeJSON(EXPENSES_FILE, expenses, { spaces: 2 });
  } else {
    const FILE = path.join(__dirname, "expenses.json");
    await fs.writeJSON(FILE, expenses, { spaces: 2 });
  }
}

export async function addNewExpense(name, amount, category) {
  const expenses = await getExpenses();
  const existingExpense = expenses.find((expense) => expense.name === name);
  if (existingExpense) {
    console.warn(`Expenses name should be unique: ${name}`);
    return;
  }
  const newExpense = {
    id: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
    name,
    amount: `$${amount}`,
    category: category || "",
    created: new Date(),
  };
  expenses.push(newExpense);
  await recordExpenses(expenses);
  console.log("Expense added:", newExpense);
}

export async function updateExpense(id, options) {
  const expenses = await getExpenses();
  const existingExpenseIndex = expenses.findIndex(
    (expense) => expense.id === parseInt(id)
  );
  if (!!existingExpenseIndex) {
    console.warn(`Could not find expense with: ${id}`);
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

  await recordExpenses(expenses);
  console.log("Expense updated:", expenses[existingExpenseIndex]);
}