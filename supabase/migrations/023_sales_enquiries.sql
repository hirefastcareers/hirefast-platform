-- Sales enquiries from employer/sales "Request a Demo" form
CREATE TABLE IF NOT EXISTS sales_enquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_enquiries_created_at ON sales_enquiries(created_at DESC);

ALTER TABLE sales_enquiries ENABLE ROW LEVEL SECURITY;

-- Allow anonymous submissions from the sales page
CREATE POLICY "Anyone can submit a sales enquiry"
  ON sales_enquiries FOR INSERT
  TO anon
  WITH CHECK (true);

COMMENT ON TABLE sales_enquiries IS 'Demo requests from /employer/sales.';
