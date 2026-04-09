"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
var adapter_pg_1 = require("@prisma/adapter-pg");
var client_1 = require("@prisma/client");
var connectionString = "".concat(process.env.DATABASE_URL);
var adapter = new adapter_pg_1.PrismaPg({ connectionString: connectionString });
var prisma = new client_1.PrismaClient({});
exports.prisma = prisma;
