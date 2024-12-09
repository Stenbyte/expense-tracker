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
  .command("add <name> <amount> [category]")
  .description("Add a new expense, name and amount are required")
  .action(async (name, amount, category) => {
    const expenses = await getExpenses();
    const existingExpense = expenses.find((expense) => expense.name === name);
    if (existingExpense) {
      console.warn(`Expenses name should be unique: ${name}`);
      return;
    }
    const newExpense = {
      ID: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
      name,
      amount: `$${amount}`,
      category: category || "",
      created: new Date(),
    };
    expenses.push(newExpense);
    await recordExpenses(expenses);
    console.log("Expense added:", newExpense);
  });

program.parse(process.argv);
