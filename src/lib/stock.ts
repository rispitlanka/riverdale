import Product from "./models/Product";
import Jewellery from "./models/Jewellery";

type ReduceStockResult = {
  ok: boolean;
  error?: string;
};

type StockOrderItem = {
  itemId: unknown;
  itemType: "product" | "jewellery" | "sell-metal";
  name: string;
  quantity: number;
};

type StockOrder = {
  items?: StockOrderItem[];
};

export async function reduceStockForOrder(order: StockOrder): Promise<ReduceStockResult> {
  const stockItems = (order.items ?? []).filter((item: StockOrderItem) => {
    return item.itemType === "product" || item.itemType === "jewellery";
  });

  for (const item of stockItems) {
    const qty = Number(item.quantity) || 0;
    if (qty <= 0) continue;

    const updated =
      item.itemType === "product"
        ? await Product.findOneAndUpdate(
            {
              _id: item.itemId,
              stockQuantity: { $gte: qty },
            },
            {
              $inc: { stockQuantity: -qty },
            },
            { new: true }
          )
        : await Jewellery.findOneAndUpdate(
            {
              _id: item.itemId,
              stockQuantity: { $gte: qty },
            },
            {
              $inc: { stockQuantity: -qty },
            },
            { new: true }
          );

    if (!updated) {
      return {
        ok: false,
        error: `Insufficient stock for ${item.name}`,
      };
    }

    const nextQty =
      typeof (updated as any).stockQuantity === "number"
        ? (updated as any).stockQuantity
        : 0;
    const nextInStock = nextQty > 0;

    if (updated.inStock !== nextInStock) {
      if (item.itemType === "product") {
        await Product.updateOne({ _id: updated._id }, { $set: { inStock: nextInStock } });
      } else {
        await Jewellery.updateOne({ _id: updated._id }, { $set: { inStock: nextInStock } });
      }
    }
  }

  return { ok: true };
}
