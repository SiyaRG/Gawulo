import React from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Repeat as RepeatIcon,
  AttachMoney as MoneyIcon,
  Star as StarIcon,
} from '@mui/icons-material';

interface CustomerInsightsCardProps {
  data: {
    total_customers: number;
    repeat_customers: number;
    avg_order_value: number;
    top_customers: Array<{
      customer_id: number;
      name: string;
      order_count: number;
      total_spent: number;
    }>;
  };
}

const CustomerInsightsCard: React.FC<CustomerInsightsCardProps> = ({ data }) => {
  const theme = useTheme();

  if (!data) {
    return (
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Customer Insights
          </Typography>
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No customer data available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const repeatCustomerPercentage =
    data.total_customers > 0
      ? ((data.repeat_customers / data.total_customers) * 100).toFixed(1)
      : '0.0';

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          Customer Insights
        </Typography>
        <Grid container spacing={3}>
          {/* Total Customers */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.primary.light,
                color: theme.palette.primary.contrastText,
                textAlign: 'center',
              }}
            >
              <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data.total_customers}
              </Typography>
              <Typography variant="body2">Total Customers</Typography>
            </Box>
          </Grid>

          {/* Repeat Customers */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.secondary.light,
                color: theme.palette.secondary.contrastText,
                textAlign: 'center',
              }}
            >
              <RepeatIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data.repeat_customers}
              </Typography>
              <Typography variant="body2">
                Repeat Customers ({repeatCustomerPercentage}%)
              </Typography>
            </Box>
          </Grid>

          {/* Average Order Value */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.success.light,
                color: theme.palette.success.contrastText,
                textAlign: 'center',
              }}
            >
              <MoneyIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {new Intl.NumberFormat('en-ZA', {
                  style: 'currency',
                  currency: 'ZAR',
                  maximumFractionDigits: 0,
                }).format(data.avg_order_value)}
              </Typography>
              <Typography variant="body2">Average Order Value</Typography>
            </Box>
          </Grid>

          {/* Customer Retention Rate */}
          <Grid item xs={12} sm={6} md={3}>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                backgroundColor: theme.palette.warning.light,
                color: theme.palette.warning.contrastText,
                textAlign: 'center',
              }}
            >
              <StarIcon sx={{ fontSize: 40, mb: 1 }} />
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {repeatCustomerPercentage}%
              </Typography>
              <Typography variant="body2">Retention Rate</Typography>
            </Box>
          </Grid>

          {/* Top Customers */}
          {data.top_customers && data.top_customers.length > 0 && (
            <Grid item xs={12}>
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                  Top Customers
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {data.top_customers.map((customer, index) => (
                    <Box
                      key={customer.customer_id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 1.5,
                        mb: 1,
                        borderRadius: 1,
                        backgroundColor: theme.palette.action.hover,
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 'bold',
                            minWidth: 24,
                            textAlign: 'center',
                          }}
                        >
                          #{index + 1}
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                          {customer.name}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                          {customer.order_count} orders
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          {new Intl.NumberFormat('en-ZA', {
                            style: 'currency',
                            currency: 'ZAR',
                          }).format(customer.total_spent)}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );
};

export default CustomerInsightsCard;

