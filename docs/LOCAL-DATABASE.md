# Local MySQL

This project uses the installed MySQL 8.4 server with a separate data directory at `.local/mysql-data`. It listens only on 127.0.0.1:3306, and is not installed as an automatically starting Windows service.

The database is `brand_db_mysql`. Its dedicated application user is `ak_local`; its generated password is in `backend/.env`. Local root credentials are in `.local/mysql-admin.cnf`. Both paths are ignored by Git. Do not delete `.local/mysql-data`: it contains your local database.

After restarting Windows, start the database from the backend terminal:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-local-db.ps1
npm run dev
```

All three existing migrations were applied during setup. The new database starts empty. Register a local test account with an email you own to test the email reset flow. Real delivery also requires your Resend key and verified sender in local `.env`.

Hostinger database configuration and data were not changed. Future code pushes do not transfer this local database or its credentials.
