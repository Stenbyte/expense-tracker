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

// Delete
program
  .command("delete <id>")
  .description("Deletes existing expense")
  .action(async (id) => {
    const expenses = await getExpenses();

    const existingExpense = expenses.some(
      (expense) => expense.id === parseInt(id)
    );
    if (!existingExpense) {
      console.log(`Could not find expense with id: ${id}`);
      return;
    }

    const filteredExpenses = expenses.filter(
      (expense) => expense.id === parseInt(id)
    );
    await recordExpenses(filteredExpenses);
    console.log(`Expense deleted with id: ${id}`);
  });

// View expenses
program
  .command("list")
  .description("View expenses")
  .option("--all", "view all expenses")
  .option("--summary", "summary  of all expenses")
  .option("--month <month>", "summary  of all expenses for given month (1-12)")
  .option(
    "--year <year>",
    "summary  of all expenses for given year. Default, current year"
  )
  .action(async (options) => {
    const expenses = await getExpenses();
    processOptions(expenses, options);
  });

program.parse(process.argv);

const processOptions = (expenses, options) => {
  const actions = {
    summary: () => handleSummary(expenses),
    all: () => handleAll(expenses),
    month: () => handleByMonth(expenses, options),
  };

  Object.keys(actions).forEach((key) => {
    if (options[key]) {
      actions[key]();
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

const handleByMonth = (expenses, options) => {
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
