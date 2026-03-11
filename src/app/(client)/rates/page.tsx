import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import dbConnect from '@/lib/mongodb';
import Category from '@/lib/models/Category';
import Metal from '@/lib/models/Metal';
import { formatCurrency } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function RatesPage() {
  await dbConnect();

  const categories = await Category.find({ isActive: true }).lean();
  
  const ratesData = await Promise.all(
    categories.map(async (category) => {
      const metals = await Metal.find({
        category: category._id,
        isActive: true,
      })
        .sort({ pricePerGram: 1 })
        .limit(1)
        .lean();

      const avgPrice = metals.length > 0 ? metals[0].pricePerGram : 0;

      return {
        category: category.name,
        avgPrice,
        metalCount: await Metal.countDocuments({
          category: category._id,
          isActive: true,
        }),
      };
    })
  );

  const lastUpdated = new Date().toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-white">Current Rates</h1>
        <p className="text-gray-300">Live precious metal rates per gram</p>
        <p className="text-sm text-gray-400 mt-2">Last updated: {lastUpdated}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Rates</CardTitle>
          <CardDescription>
            Current market rates for precious metals (per gram)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead>Starting Price / Gram</TableHead>
                <TableHead>Products Available</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ratesData.map((rate) => (
                <TableRow key={rate.category}>
                  <TableCell className="font-semibold text-lg">{rate.category}</TableCell>
                  <TableCell className="text-lg font-bold text-amber-600">
                    {rate.avgPrice > 0 ? formatCurrency(rate.avgPrice) : 'N/A'}
                  </TableCell>
                  <TableCell>{rate.metalCount} products</TableCell>
                  <TableCell>
                    <Badge variant="default">Available</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="mt-8 bg-blue-900/30 border border-blue-500/30 p-6 rounded-lg">
        <h3 className="font-semibold text-lg mb-2 text-blue-300">Note:</h3>
        <ul className="list-disc list-inside space-y-1 text-gray-300">
          <li>Rates shown are indicative and may vary based on purity and quantity</li>
          <li>Final rates will be provided after inspection</li>
          <li>Prices are updated regularly based on market conditions</li>
          <li>Contact us for bulk orders or special rates</li>
        </ul>
      </div>
    </div>
  );
}

