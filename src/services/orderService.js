import { randomUUID } from 'crypto';

class OrderService {
  constructor(databaseService) {
    this.databaseService = databaseService;
    this.orders = new Map();
  }

  createOrder({ planId, buyer, notes }) {
    const plan = this.databaseService.getPlan(planId);
    if (!plan) {
      throw new Error('Unknown database plan.');
    }

    const orderId = randomUUID();
    const createdAt = new Date().toISOString();
    const order = {
      id: orderId,
      planId,
      status: 'processing',
      buyer,
      notes: notes ?? null,
      createdAt,
      totalDueUsd: plan.priceUsd,
      planSnapshot: {
        id: plan.id,
        name: plan.name,
        headline: plan.headline,
        priceUsd: plan.priceUsd,
        capacity: plan.capacity,
        description: plan.description,
        pitch: plan.pitch,
        features: plan.features,
        context: plan.context,
        sampleQueries: plan.sampleQueries
      }
    };
    this.orders.set(orderId, order);
    return order;
  }

  getOrder(orderId) {
    return this.orders.get(orderId) ?? null;
  }
}

export function createOrderService(databaseService) {
  return new OrderService(databaseService);
}
