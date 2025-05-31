import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init('B6EzNeSIjQOTyWOLO');

interface OrderEmailData {
  id: string;
  name: string;
  phoneNumber: string;
  address: string;
  items: {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }[];
  total: number;
}

/**
 * Send order confirmation email to the store owner
 */
export const sendOrderConfirmationEmail = async (orderData: OrderEmailData): Promise<void> => {
  try {
    // Format items for email
    const itemsList = orderData.items.map(item => 
      `${item.name} (${item.quantity}x) - ${item.price} د.ل`
    ).join('\n');
    
    // Prepare template parameters
    const templateParams = {
      order_id: orderData.id,
      customer_name: orderData.name,
      customer_phone: orderData.phoneNumber,
      customer_address: orderData.address,
      order_items: itemsList,
      order_total: orderData.total.toFixed(2),
      order_date: new Date().toLocaleDateString('ar-LY')
    };
    
    // Send email using EmailJS
    await emailjs.send(
      'itzhapy@gmail.com', // Service ID
      'template_f5rh7n9', // Template ID
      templateParams
    );
    
    console.log('Order confirmation email sent successfully');
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    throw error;
  }
};
