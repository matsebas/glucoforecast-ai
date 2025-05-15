import { relations } from "drizzle-orm/relations";
import { users, glucoseReadings, sessions, account } from "./schema";

export const glucoseReadingsRelations = relations(glucoseReadings, ({one}) => ({
	user: one(users, {
		fields: [glucoseReadings.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	glucoseReadings: many(glucoseReadings),
	sessions: many(sessions),
	accounts: many(account),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const accountRelations = relations(account, ({one}) => ({
	user: one(users, {
		fields: [account.userId],
		references: [users.id]
	}),
}));