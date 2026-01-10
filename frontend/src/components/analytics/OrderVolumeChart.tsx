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
import { format } from 'date-fns';

interface OrderVolumeChartProps {
  data: Array<{
    date: string;
    count: number;
    avg_order_value: number;
  }>;
}

const OrderVolumeChart: React.FC<OrderVolumeChartProps> = ({ data }) => {
  const theme = useTheme();

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Order Volume (Last 30 Days)
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No order volume data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  // Format data for chart
  const chartData = data.map((item) => ({
    date: format(new Date(item.date), 'MMM dd'),
    fullDate: item.date,
    orders: item.count,
    avgOrderValue: Number(item.avg_order_value.toFixed(2)),
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
            {payload[0].payload.fullDate
              ? format(new Date(payload[0].payload.fullDate), 'MMM dd, yyyy')
              : ''}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {entry.name === 'Orders'
                ? entry.value
                : new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                  }).format(entry.value)}
            </Typography>
          ))}
        </Box>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Order Volume (Last 30 Days)
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                tick={{ fontSize: 12 }}
                label={{ value: 'Order Count', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) =>
                  new Intl.NumberFormat('en-ZA', {
                    style: 'currency',
                    currency: 'ZAR',
                    notation: 'compact',
                  }).format(value)
                }
                label={{ value: 'Avg Order Value', angle: 90, position: 'insideRight' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="orders"
                fill={theme.palette.primary.main}
                name="Orders"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="avgOrderValue"
                fill={theme.palette.secondary.main}
                name="Avg Order Value"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );
};

export default OrderVolumeChart;

