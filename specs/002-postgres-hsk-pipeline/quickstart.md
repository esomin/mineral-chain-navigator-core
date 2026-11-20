# Quickstart: PostgreSQL Persistence & Customs ETL Pipeline

## 1. Prerequisites & Dependencies

Install required packages:
```bash
npm install drizzle-orm postgres csv-parse
npm install -D drizzle-kit @electric-sql/pglite
```

## 2. Running Migrations & Seeding

```bash
# Push schema directly to database (or generate migrations)
npx drizzle-kit push

# Seed master supply chain graph into DB
npm run db:seed
```

## 3. Running Customs Trade Data ETL

Place the customs CSV in `data/raw/customs/` and run:
```bash
npm run etl:customs
```

## 4. Running Tests (PGlite In-Memory)

```bash
# Runs full test suite without Docker or external DB
npm run test
```

