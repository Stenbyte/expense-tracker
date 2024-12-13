import { program } from "commander";

import {
  processListOptions,
  addNewExpense,
  updateExpense,
  getExpenses,
  recordExpenses,
} from "./helperFunctions.js";

// Add Expense
program
  .command("add <name> <amount> [category]")
  .description("Add a new expense, name and amount are required")
  .action(async (name, amount, category) => {
    await addNewExpense(name, amount, category);
  });

// Update Expense
program
  .command("update <id>")
  .description("Updates existing expense")
  .option("--n <name>", "edit name")
  .option("--a <amount>", "edit amount")
  .option("--c <category>", "edit category")
  .action(async (id, options) => {
    await updateExpense(id, options);
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
  .option("--category <category>", "summary by category")
  .option(
    "--year <year>",
    "summary  of all expenses for given year. Default, current year"
  )
  .action(async (options) => {
    processListOptions("list", options);
  });

program.parse(process.argv);
