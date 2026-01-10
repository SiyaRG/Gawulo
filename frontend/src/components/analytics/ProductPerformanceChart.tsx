import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Box, Typography, Card, CardContent, useTheme } from '@mui/material';

interface ProductPerformanceChartProps {
  data: Array<{
    product_id: number;
    product_name: string;
    revenue: number;
    order_count: number;
  }>;
  onProductClick?: (productId: number) => void;
}

const ProductPerformanceChart: React.FC<ProductPerformanceChartProps> = ({
  data,
  onProductClick,
}) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Top Products by Revenue
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No product data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart (limit to top 10)
  const chartData = data.slice(0, 10).map((item) => ({
    name: item.product_name.length > 20
      ? `${item.product_name.substring(0, 20)}...`
      : item.product_name,
    fullName: item.product_name,
    revenue: Number(item.revenue.toFixed(2)),
    orders: item.order_count,
    productId: item.product_id,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            backgroundColor: 'background.paper',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 1,
            p: 1.5,
            boxShadow: theme.shadows[3],
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
            {payload[0].payload.fullName}
          </Typography>
          <Typography variant="body2" color="primary">
            Revenue: {new Intl.NumberFormat('en-ZA', {
              style: 'currency',
              currency: 'ZAR',
            }).format(payload[0].value)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Orders: {payload[0].payload.orders}
          </Typography>
        </Box>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Top Products by Revenue
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                type="number"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                    notation: 'compact',
                  }).format(value)
                }
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                dataKey="revenue"
                fill={theme.palette.primary.main}
                name="Revenue"
                radius={[0, 4, 4, 0]}
                onClick={(data: any) => {
                  if (onProductClick && data.productId) {
                    onProductClick(data.productId);
                  }
                }}
                style={{ cursor: onProductClick ? 'pointer' : 'default' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ProductPerformanceChart;

