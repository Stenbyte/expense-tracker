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

// Add Expense
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
      id: expenses.length ? expenses[expenses.length - 1].id + 1 : 1,
      name,
      amount: `$${amount}`,
      category: category || "",
      created: new Date(),
    };
    expenses.push(newExpense);
    await recordExpenses(expenses);
    console.log("Expense added:", newExpense);
  });

// Update Expense
program
  .command("update <id>")
  .description("Updates existing expense")
  .option("--n <name>", "edit name")
  .option("--a <amount>", "edit amount")
  .option("--c <category>", "edit category")
  .action(async (id, options) => {
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
  });

program.parse(process.argv);
