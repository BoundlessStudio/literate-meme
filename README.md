# Database Marketplace (OpenAI Apps SDK sample)

This project demonstrates how to build an [OpenAI Apps SDK](https://developers.openai.com/apps-sdk) integration that lets an agent sell pre-hosted sandbox databases. The assistant can browse the catalog, create lightweight purchase orders, and run read-only SQL queries against curated datasets via an [MCP](https://modelcontextprotocol.io/) server that also renders an inline marketplace component.

## Features

- **Catalog discovery** – list available database plans with pricing, schema context, and sample queries.
- **Purchase workflow** – capture structured purchase intents and return order receipts for the hosting team.
- **Hosted SQL execution** – run read-only SQL against synthetic datasets (CRM, e-commerce, IoT telemetry) so the agent can answer product questions with live results.
- **MCP-first** – exposes the catalog, ordering, and SQL tools through the official `@modelcontextprotocol/sdk` server plus a custom HTML component.

## Project structure

```
├── app.yaml               # Apps SDK manifest pointing at the MCP server
├── assets/database-marketplace.html  # Inline widget rendered by ChatGPT
├── config/catalog.js      # Database plan definitions, schema, and seed data
├── src/
│   ├── server.js          # MCP SSE server wiring tools and resources
│   └── services/
│       ├── databaseService.js  # Initializes sql.js engines per plan
│       └── orderService.js     # In-memory order receipts
└── package.json
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

   Use Node.js 18+ or Deno with Node compatibility. The project relies on [`sql.js`](https://sql.js.org/) which bundles SQLite to run in memory, so no native compilation is required.

2. **Run the MCP server locally**

   ```bash
   npm run dev
   ```

   The SSE server boots on <http://localhost:8000> by default and seeds each plan with synthetic data.

3. **Verify with MCP Inspector**

   - Start [MCP Inspector](https://modelcontextprotocol.io/inspector) and connect it to `http://localhost:8000/mcp` with message posts proxied to `http://localhost:8000/mcp/messages`.
   - List tools and resources to confirm the database marketplace widget renders with structured content.

4. **Expose the server to the Apps SDK**

   - Update `app.yaml` with your deployed HTTPS base URL and contact details.
   - Publish the manifest and SSE endpoints following the [Apps SDK deployment guide](https://developers.openai.com/apps-sdk).
   - Create an App in the OpenAI UI, point it at `app.yaml`, and allow the assistant to call the MCP tools.

5. **Playbook for agents**

   - Call `list_database_plans` to summarize available datasets and pricing.
   - Use `describe_database_plan` to fetch schema context and sample queries for a specific plan.
   - When the user is ready, invoke `purchase_database_plan` with buyer details to log the purchase intent.
   - For ad-hoc analytics, call `run_database_query` with a read-only `SELECT` statement and summarize the results back to the user.

## Security notes

- SQL execution is restricted to single `SELECT` statements. Attempts to run mutating commands return validation errors.
- Order receipts are held in memory only; plug in your billing or CRM system before using in production.
- Add authentication (API keys or OAuth) before exposing the service publicly.

## Next steps

- Persist orders in a database and emit webhooks for downstream invoicing.
- Attach per-customer credentials so each buyer gets isolated compute and storage.
- Layer usage metering and alerting for long-running SQL jobs.

## License

[MIT](LICENSE)
