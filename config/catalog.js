export const databasePlans = [
  {
    id: "sales-crm",
    name: "Sales CRM Sandbox",
    headline: "Curated SaaS CRM dataset seeded with leads, opportunities, and activities.",
    priceUsd: 19,
    capacity: {
      storageGb: 1,
      queryLimitPerHour: 200
    },
    description:
      "Ideal for agents that need realistic CRM data to demo SQL automations. Includes customers, pipelines, activities, and subscription revenue.",
    pitch:
      "Unlock a sandbox CRM with production-style datasets so the agent can explore customer journeys, churn, and ARR analytics without touching live systems.",
    features: [
      "Five interrelated tables with normalized references",
      "Synthetic yet realistic demographic, pipeline, and activity data",
      "Daily snapshot table for ARR and churn modeling",
      "Pre-computed views for quick onboarding"
    ],
    context: [
      "Tables: customers, opportunities, activity_logs, subscriptions, arr_snapshots",
      "customers: company_name, industry, region, employee_count, owner_id",
      "opportunities: customer_id, stage, amount, created_at, close_date, source",
      "activity_logs: opportunity_id, owner_id, activity_type, sentiment, occurred_at",
      "subscriptions: customer_id, plan, monthly_recurring_revenue, status, renewed_at",
      "arr_snapshots: snapshot_date, total_arr, new_arr, churned_arr"
    ],
    sampleQueries: [
      "SELECT region, SUM(amount) AS pipeline FROM opportunities WHERE stage IN ('Proposal', 'Negotiation') GROUP BY region ORDER BY pipeline DESC;",
      "SELECT strftime('%Y-%m', occurred_at) AS month, COUNT(*) AS touchpoints FROM activity_logs GROUP BY month ORDER BY month;",
      "SELECT plan, SUM(monthly_recurring_revenue) AS mrr FROM subscriptions WHERE status = 'active' GROUP BY plan;"
    ],
    sql: {
      schema: [
        "CREATE TABLE customers (id INTEGER PRIMARY KEY AUTOINCREMENT, company_name TEXT NOT NULL, industry TEXT NOT NULL, region TEXT NOT NULL, employee_count INTEGER, owner_id INTEGER);",
        "CREATE TABLE opportunities (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL REFERENCES customers(id), stage TEXT NOT NULL, amount REAL NOT NULL, created_at TEXT NOT NULL, close_date TEXT, source TEXT, owner_id INTEGER);",
        "CREATE TABLE activity_logs (id INTEGER PRIMARY KEY AUTOINCREMENT, opportunity_id INTEGER NOT NULL REFERENCES opportunities(id), owner_id INTEGER NOT NULL, activity_type TEXT NOT NULL, sentiment TEXT NOT NULL, occurred_at TEXT NOT NULL);",
        "CREATE TABLE subscriptions (id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id INTEGER NOT NULL REFERENCES customers(id), plan TEXT NOT NULL, monthly_recurring_revenue REAL NOT NULL, status TEXT NOT NULL, renewed_at TEXT);",
        "CREATE TABLE arr_snapshots (id INTEGER PRIMARY KEY AUTOINCREMENT, snapshot_date TEXT NOT NULL, total_arr REAL NOT NULL, new_arr REAL NOT NULL, churned_arr REAL NOT NULL);"
      ],
      seed: [
        "INSERT INTO customers (company_name, industry, region, employee_count, owner_id) VALUES\n          ('Blue Horizon', 'Cloud', 'North America', 120, 101),\n          ('FinEdge Analytics', 'Fintech', 'Europe', 80, 102),\n          ('Harvest AI', 'Agriculture', 'North America', 35, 103),\n          ('Beacon Retail', 'Retail', 'Asia-Pacific', 220, 104),\n          ('Pulse Health', 'Healthcare', 'North America', 150, 105);",
        "INSERT INTO opportunities (customer_id, stage, amount, created_at, close_date, source, owner_id) VALUES\n          (1, 'Discovery', 25000, '2024-01-12', NULL, 'Inbound', 101),\n          (1, 'Proposal', 68000, '2024-02-18', NULL, 'Partner', 101),\n          (2, 'Negotiation', 85000, '2024-01-05', '2024-03-28', 'Outbound', 102),\n          (3, 'Closed Won', 42000, '2023-12-01', '2024-01-20', 'Outbound', 103),\n          (4, 'Closed Lost', 56000, '2024-02-10', '2024-03-05', 'Event', 104),\n          (5, 'Proposal', 73000, '2024-03-08', NULL, 'Inbound', 105);",
        "INSERT INTO activity_logs (opportunity_id, owner_id, activity_type, sentiment, occurred_at) VALUES\n          (1, 101, 'call', 'positive', '2024-02-01'),\n          (1, 101, 'email', 'neutral', '2024-02-03'),\n          (2, 101, 'demo', 'positive', '2024-03-01'),\n          (3, 102, 'call', 'positive', '2024-02-15'),\n          (4, 103, 'on-site', 'positive', '2024-01-15'),\n          (5, 104, 'call', 'negative', '2024-03-11');",
        "INSERT INTO subscriptions (customer_id, plan, monthly_recurring_revenue, status, renewed_at) VALUES\n          (1, 'Scale', 5500, 'active', '2024-02-01'),\n          (2, 'Growth', 3200, 'active', '2024-01-15'),\n          (3, 'Starter', 900, 'active', '2023-11-01'),\n          (4, 'Scale', 6100, 'churned', '2023-12-15'),\n          (5, 'Growth', 3400, 'trial', NULL);",
        "INSERT INTO arr_snapshots (snapshot_date, total_arr, new_arr, churned_arr) VALUES\n          ('2023-12-31', 1820000, 98000, 21000),\n          ('2024-01-31', 1890000, 122000, 45000),\n          ('2024-02-29', 1965000, 110000, 38000);"
      ]
    }
  },
  {
    id: "commerce-warehouse",
    name: "E-commerce Warehouse",
    headline: "Inventory, orders, and fulfillment metrics for a fast-scaling marketplace.",
    priceUsd: 39,
    capacity: {
      storageGb: 5,
      queryLimitPerHour: 350
    },
    description:
      "Designed for supply chain copilots and BI automations. Includes product catalogs, orders, shipment SLAs, and procurement costs.",
    pitch:
      "Spin up a warehouse full of multi-channel commerce data so the assistant can optimize stock levels, margin, and shipping promises.",
    features: [
      "Dimensional model covering products, vendors, orders, and shipments",
      "Inventory balances with safety stock recommendations",
      "Procurement schedule including lead times and bulk costs",
      "Historical SLA performance for last-mile partners"
    ],
    context: [
      "Tables: products, vendors, inventories, orders, order_items, shipments, procurement_schedule",
      "products: sku, name, category, unit_cost, price", 
      "vendors: vendor_code, vendor_name, reliability_score, lead_time_days",
      "inventories: sku, warehouse, on_hand, reserved, safety_stock",
      "orders: order_number, order_date, channel, customer_segment, total_amount",
      "order_items: order_number, sku, quantity, unit_price",
      "shipments: order_number, carrier, promised_date, delivered_date, status",
      "procurement_schedule: sku, vendor_code, reorder_date, quantity, expected_cost"
    ],
    sampleQueries: [
      "SELECT warehouse, SUM(on_hand - reserved) AS net_available FROM inventories GROUP BY warehouse;",
      "SELECT carrier, AVG(julianday(delivered_date) - julianday(promised_date)) AS avg_slip FROM shipments WHERE delivered_date IS NOT NULL GROUP BY carrier;",
      "SELECT sku, SUM(quantity) AS total_units FROM order_items GROUP BY sku ORDER BY total_units DESC LIMIT 5;"
    ],
    sql: {
      schema: [
        "CREATE TABLE products (sku TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL, unit_cost REAL NOT NULL, price REAL NOT NULL);",
        "CREATE TABLE vendors (vendor_code TEXT PRIMARY KEY, vendor_name TEXT NOT NULL, reliability_score INTEGER NOT NULL, lead_time_days INTEGER NOT NULL);",
        "CREATE TABLE inventories (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL REFERENCES products(sku), warehouse TEXT NOT NULL, on_hand INTEGER NOT NULL, reserved INTEGER NOT NULL, safety_stock INTEGER NOT NULL);",
        "CREATE TABLE orders (order_number TEXT PRIMARY KEY, order_date TEXT NOT NULL, channel TEXT NOT NULL, customer_segment TEXT NOT NULL, total_amount REAL NOT NULL);",
        "CREATE TABLE order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT NOT NULL REFERENCES orders(order_number), sku TEXT NOT NULL REFERENCES products(sku), quantity INTEGER NOT NULL, unit_price REAL NOT NULL);",
        "CREATE TABLE shipments (id INTEGER PRIMARY KEY AUTOINCREMENT, order_number TEXT NOT NULL REFERENCES orders(order_number), carrier TEXT NOT NULL, promised_date TEXT NOT NULL, delivered_date TEXT, status TEXT NOT NULL);",
        "CREATE TABLE procurement_schedule (id INTEGER PRIMARY KEY AUTOINCREMENT, sku TEXT NOT NULL REFERENCES products(sku), vendor_code TEXT NOT NULL REFERENCES vendors(vendor_code), reorder_date TEXT NOT NULL, quantity INTEGER NOT NULL, expected_cost REAL NOT NULL);"
      ],
      seed: [
        "INSERT INTO products (sku, name, category, unit_cost, price) VALUES\n          ('SKU-100', 'Solar Backpack', 'Outdoors', 48.50, 99.00),\n          ('SKU-200', 'Smart Water Bottle', 'Wellness', 22.00, 49.00),\n          ('SKU-300', 'Wireless Projector', 'Electronics', 180.00, 349.00),\n          ('SKU-400', 'Noise-canceling Earbuds', 'Electronics', 55.00, 129.00),\n          ('SKU-500', 'Ergonomic Desk Lamp', 'Home Office', 18.00, 39.00);",
        "INSERT INTO vendors (vendor_code, vendor_name, reliability_score, lead_time_days) VALUES\n          ('VEND-A', 'Aurora Manufacturing', 96, 12),\n          ('VEND-B', 'BrightPath Logistics', 90, 8),\n          ('VEND-C', 'Nimbus Components', 82, 15);",
        "INSERT INTO inventories (sku, warehouse, on_hand, reserved, safety_stock) VALUES\n          ('SKU-100', 'WH-West', 320, 75, 110),\n          ('SKU-200', 'WH-West', 500, 120, 150),\n          ('SKU-300', 'WH-East', 140, 40, 80),\n          ('SKU-400', 'WH-East', 260, 60, 90),\n          ('SKU-500', 'WH-Central', 430, 85, 140);",
        "INSERT INTO orders (order_number, order_date, channel, customer_segment, total_amount) VALUES\n          ('ORD-5001', '2024-02-01', 'Marketplace', 'Consumer', 299.00),\n          ('ORD-5002', '2024-02-04', 'Direct', 'Enterprise', 1299.00),\n          ('ORD-5003', '2024-02-06', 'Marketplace', 'Consumer', 198.00),\n          ('ORD-5004', '2024-02-11', 'Retail', 'Retailer', 2150.00);",
        "INSERT INTO order_items (order_number, sku, quantity, unit_price) VALUES\n          ('ORD-5001', 'SKU-400', 1, 129.00),\n          ('ORD-5001', 'SKU-100', 1, 99.00),\n          ('ORD-5001', 'SKU-200', 1, 49.00),\n          ('ORD-5002', 'SKU-300', 2, 349.00),\n          ('ORD-5003', 'SKU-100', 2, 99.00),\n          ('ORD-5004', 'SKU-400', 10, 119.00);",
        "INSERT INTO shipments (order_number, carrier, promised_date, delivered_date, status) VALUES\n          ('ORD-5001', 'SwiftShip', '2024-02-05', '2024-02-04', 'delivered'),\n          ('ORD-5002', 'Nimbus Freight', '2024-02-12', '2024-02-14', 'delayed'),\n          ('ORD-5003', 'SwiftShip', '2024-02-08', '2024-02-08', 'delivered'),\n          ('ORD-5004', 'PostalPro', '2024-02-18', NULL, 'in_transit');",
        "INSERT INTO procurement_schedule (sku, vendor_code, reorder_date, quantity, expected_cost) VALUES\n          ('SKU-100', 'VEND-A', '2024-02-20', 400, 19400.00),\n          ('SKU-200', 'VEND-B', '2024-02-18', 600, 13200.00),\n          ('SKU-300', 'VEND-C', '2024-02-28', 150, 27000.00);"
      ]
    }
  },
  {
    id: "iot-telemetry",
    name: "IoT Telemetry Lake",
    headline: "Time-series metrics from smart building sensors with anomaly flags.",
    priceUsd: 59,
    capacity: {
      storageGb: 12,
      queryLimitPerHour: 500
    },
    description:
      "Purpose-built for operations copilots that need to analyze energy consumption, occupancy, and predictive maintenance signals.",
    pitch:
      "Launch an isolated telemetry lake so the assistant can investigate anomalies, recommend maintenance, and forecast energy usage without touching production systems.",
    features: [
      "Minute-level readings for HVAC, lighting, and occupancy sensors",
      "Derived views for energy intensity and carbon footprint",
      "Anomaly annotations with reason codes",
      "Maintenance tickets linked to root-cause metadata"
    ],
    context: [
      "Tables: buildings, sensors, sensor_readings, sensor_anomalies, maintenance_tickets",
      "buildings: code, city, sqft, manager_email",
      "sensors: sensor_id, building_code, sensor_type, floor, install_date",
      "sensor_readings: sensor_id, reading_ts, reading_value, unit",
      "sensor_anomalies: sensor_id, anomaly_ts, severity, reason",
      "maintenance_tickets: ticket_id, sensor_id, opened_ts, resolved_ts, resolution_notes"
    ],
    sampleQueries: [
      "SELECT b.city, AVG(r.reading_value) AS avg_temp FROM sensor_readings r JOIN sensors s ON r.sensor_id = s.sensor_id JOIN buildings b ON s.building_code = b.code WHERE s.sensor_type = 'temperature' AND r.reading_ts BETWEEN '2024-02-01' AND '2024-02-07' GROUP BY b.city;",
      "SELECT reason, COUNT(*) AS occurrences FROM sensor_anomalies GROUP BY reason ORDER BY occurrences DESC;",
      "SELECT julianday(resolved_ts) - julianday(opened_ts) AS resolution_days FROM maintenance_tickets WHERE resolved_ts IS NOT NULL;"
    ],
    sql: {
      schema: [
        "CREATE TABLE buildings (code TEXT PRIMARY KEY, city TEXT NOT NULL, sqft INTEGER NOT NULL, manager_email TEXT NOT NULL);",
        "CREATE TABLE sensors (sensor_id TEXT PRIMARY KEY, building_code TEXT NOT NULL REFERENCES buildings(code), sensor_type TEXT NOT NULL, floor INTEGER, install_date TEXT);",
        "CREATE TABLE sensor_readings (id INTEGER PRIMARY KEY AUTOINCREMENT, sensor_id TEXT NOT NULL REFERENCES sensors(sensor_id), reading_ts TEXT NOT NULL, reading_value REAL NOT NULL, unit TEXT NOT NULL);",
        "CREATE TABLE sensor_anomalies (id INTEGER PRIMARY KEY AUTOINCREMENT, sensor_id TEXT NOT NULL REFERENCES sensors(sensor_id), anomaly_ts TEXT NOT NULL, severity TEXT NOT NULL, reason TEXT NOT NULL);",
        "CREATE TABLE maintenance_tickets (ticket_id TEXT PRIMARY KEY, sensor_id TEXT NOT NULL REFERENCES sensors(sensor_id), opened_ts TEXT NOT NULL, resolved_ts TEXT, resolution_notes TEXT);"
      ],
      seed: [
        "INSERT INTO buildings (code, city, sqft, manager_email) VALUES\n          ('BLD-01', 'New York', 250000, 'ops-ny@example.com'),\n          ('BLD-02', 'Chicago', 180000, 'ops-chicago@example.com'),\n          ('BLD-03', 'San Francisco', 160000, 'ops-sf@example.com');",
        "INSERT INTO sensors (sensor_id, building_code, sensor_type, floor, install_date) VALUES\n          ('SNS-100', 'BLD-01', 'temperature', 14, '2023-02-10'),\n          ('SNS-101', 'BLD-01', 'co2', 14, '2023-05-22'),\n          ('SNS-200', 'BLD-02', 'humidity', 6, '2023-03-14'),\n          ('SNS-201', 'BLD-02', 'occupancy', 1, '2022-11-05'),\n          ('SNS-300', 'BLD-03', 'temperature', 9, '2023-01-16');",
        "INSERT INTO sensor_readings (sensor_id, reading_ts, reading_value, unit) VALUES\n          ('SNS-100', '2024-02-01T00:00:00Z', 71.2, 'fahrenheit'),\n          ('SNS-100', '2024-02-01T01:00:00Z', 70.8, 'fahrenheit'),\n          ('SNS-101', '2024-02-01T00:00:00Z', 530.0, 'ppm'),\n          ('SNS-200', '2024-02-01T00:00:00Z', 41.0, 'percent'),\n          ('SNS-201', '2024-02-01T00:00:00Z', 35, 'people'),\n          ('SNS-300', '2024-02-01T00:00:00Z', 68.4, 'fahrenheit');",
        "INSERT INTO sensor_anomalies (sensor_id, anomaly_ts, severity, reason) VALUES\n          ('SNS-101', '2024-02-02T14:00:00Z', 'critical', 'Sustained CO2 above 800ppm'),\n          ('SNS-200', '2024-02-03T09:00:00Z', 'warning', 'Humidity drift detected'),\n          ('SNS-300', '2024-02-04T21:00:00Z', 'critical', 'Rapid cooling triggered maintenance');",
        "INSERT INTO maintenance_tickets (ticket_id, sensor_id, opened_ts, resolved_ts, resolution_notes) VALUES\n          ('MT-9001', 'SNS-101', '2024-02-02T15:00:00Z', '2024-02-03T10:00:00Z', 'Rebalanced air handling and increased intake.'),\n          ('MT-9002', 'SNS-200', '2024-02-03T10:30:00Z', NULL, NULL),\n          ('MT-9003', 'SNS-300', '2024-02-04T22:00:00Z', '2024-02-05T08:30:00Z', 'Reset chilled water valve.');"
      ]
    }
  }
];
