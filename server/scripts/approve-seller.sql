-- Approve all pending sellers
UPDATE sellers 
SET approval_status = 'approved', 
    approved_at = NOW() 
WHERE approval_status = 'pending';

-- Verify the update
SELECT 
    s.id,
    s.shop_name,
    s.approval_status,
    u.email,
    u.email_verified
FROM sellers s
JOIN users u ON s.user_id = u.id;
