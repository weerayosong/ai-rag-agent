export const fetchProducts = async () => {
  try {
    const response = await fetch('https://dummyjson.com/products');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching from DummyJSON:', error);
    throw error;
  }
};
