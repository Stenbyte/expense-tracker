const { program } = require("commander");
const fs = require("fs-extra");
const path = require("path");

const EXPENSES_FILE = path.join(__dirname, "expenses.json");

const getExpenses = async () => {
  try {
    return await fs.readJSON(EXPENSES_FILE);
  } catch {
    return [];
  }
};

const recordExpenses = async (expenses) => {
  if (EXPENSES_FILE) {
    await fs.writeJSON(EXPENSES_FILE, expenses, { spaces: 2 });
  } else {
    const FILE = path.join(__dirname, "expenses.json");
    await fs.writeJSON(FILE, expenses, { spaces: 2 });
  }
};

program
  .command("add <title> [description]")
  .description("Add a new expense")
  .action(async (title, description) => {
    const expenses = await getExpenses();
    const existingExpense = expenses.find((expense) => expense.title === title);
    if (existingExpense) {
      console.warn(`Expenses title should be unique: ${title}`);
      return;
    }
    const newExpense = {
      ID: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
      title,
      description: description || "",
      category: "pending",
      created: new Date(),
    };
    expenses.push(newExpense);
    await recordExpenses(expenses);
    console.log("Expense added:", newExpense.ID);
  });
