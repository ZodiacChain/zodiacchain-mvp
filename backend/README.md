# Backend

Fastify + TypeScript mock API and read layer for the ZodiacChain MVP.

Initial responsibilities:

- expose active draw data;
- provide mock or indexed event history;
- support fairness records and dashboard data;
- connect frontend flows to domain logic during MVP development;
- keep API responses explicit enough for the Fairness Dashboard and demo script.

The backend starts as an MVP read/mock layer. It should stay testnet-first and avoid introducing production treasury, wagering, or mainnet assumptions.