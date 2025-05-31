import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This component redirects to the products page since the shopping cart system has been removed
const Cart = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to products page
    navigate('/products');
  }, [navigate]);
  
  return null;
};

export default Cart;
