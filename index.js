import { program } from "commander";

import { processCommand } from "./helperFunctions.js";

// Add Expense
program
  .command("add <name> <amount> [category]")
  .description("Add a new expense, name and amount are required")
  .action(async (name, amount, category) => {
    processCommand("add", { name, amount, category });
  });

// Update Expense
program
  .command("update <id>")
  .description("Updates existing expense")
  .option("--n <name>", "edit name")
  .option("--a <amount>", "edit amount")
  .option("--c <category>", "edit category")
  .action(async (id, options) => {
    processCommand("update", { id, options });
  });

// Delete
program
  .command("delete <id>")
  .description("Deletes existing expense")
  .action(async (id) => {
    processCommand("delete", { id });
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
    processCommand("list", options);
  });

program.parse(process.argv);
