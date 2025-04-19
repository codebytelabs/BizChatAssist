import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import DashboardLayout from '../../../components/layout/DashboardLayout';
import { PlusIcon, PencilIcon, TrashIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';

// Types
interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  inventory: number;
  status: 'active' | 'hidden';
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'hidden'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'inventory'
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc', 'desc'

  // Sample data - in a real app this would come from an API
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Premium Hair Styling Session',
          description: 'Full hair styling session including washing, cutting, and styling.',
          price: 75,
          imageUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTJ8fGhhaXIlMjBzYWxvbnxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Services',
          inventory: 999,
          status: 'active'
        },
        {
          id: '2',
          name: 'Hair Color Treatment',
          description: 'Professional hair coloring service with premium products.',
          price: 120,
          imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NHx8aGFpciUyMGNvbG9yfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Services',
          inventory: 999,
          status: 'active'
        },
        {
          id: '3',
          name: 'Luxury Shampoo',
          description: 'Premium salon-quality shampoo for all hair types.',
          price: 28,
          imageUrl: 'https://images.unsplash.com/photo-1626766632648-f5f92da426b6?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MTl8fHNoYW1wb298ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
          category: 'Products',
          inventory: 43,
          status: 'active'
        },
        {
          id: '4',
          name: 'Hair Styling Tools Bundle',
          description: 'Complete set of professional styling tools including dryer, straightener, and curling iron.',
          price: 199,
          imageUrl: 'https://images.unsplash.com/photo-1522338140338-87df5a23cdf4?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8aGFpciUyMGRyeWVyfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Products',
          inventory: 12,
          status: 'active'
        },
        {
          id: '5',
          name: 'Deep Conditioning Treatment',
          description: 'Intensive conditioning treatment to repair damaged hair.',
          price: 45,
          imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8OXx8aGFpciUyMHRyZWF0bWVudHxlbnwwfHwwfHw%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Services',
          inventory: 999,
          status: 'active'
        },
        {
          id: '6',
          name: 'Hair Growth Serum',
          description: 'Advanced formula to promote hair growth and thickness.',
          price: 65,
          imageUrl: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8c2VydW18ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
          category: 'Products',
          inventory: 27,
          status: 'hidden'
        },
        {
          id: '7',
          name: 'Men\'s Haircut',
          description: 'Professional men\'s haircut and styling.',
          price: 35,
          imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8Mnx8YmFyYmVyfGVufDB8fDB8fA%3D%3D&auto=format&fit=crop&w=500&q=60',
          category: 'Services',
          inventory: 999,
          status: 'active'
        },
        {
          id: '8',
          name: 'Kids Haircut',
          description: 'Gentle and fun haircut experience for children.',
          price: 25,
          imageUrl: 'https://images.unsplash.com/photo-1533995116913-8b2979ed5fb4?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8NXx8a2lkcyUyMGhhaXJ8ZW58MHx8MHx8&auto=format&fit=crop&w=500&q=60',
          category: 'Services',
          inventory: 999,
          status: 'hidden'
        }
      ];
      setProducts(sampleProducts);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter products based on status and search query
  const filteredProducts = products
    .filter(product => {
      if (filter === 'all') return true;
      return product.status === filter;
    })
    .filter(product => {
      if (!searchQuery) return true;
      return (
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    let comparison = 0;
    
    if (sortBy === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === 'price') {
      comparison = a.price - b.price;
    } else if (sortBy === 'inventory') {
      comparison = a.inventory - b.inventory;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Toggle sort direction
  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <DashboardLayout>
      <Head>
        <title>Products & Services | BizChatAssist</title>
        <meta name="description" content="Manage your products and services" />
      </Head>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Products & Services</h1>
          <Link 
            href="/client-dashboard/products/new"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Product
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="p-4 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
              <div className="w-full sm:w-64">
                <div className="relative rounded-md shadow-sm">
                  <input
                    type="text"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-4 pr-10 sm:text-sm border-gray-300 rounded-md"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'all' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setFilter('hidden')}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filter === 'hidden' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  Hidden
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new product.</p>
              <div className="mt-6">
                <Link
                  href="/client-dashboard/products/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  New Product
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center">
                        Name
                        {sortBy === 'name' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                            <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('price')}
                    >
                      <div className="flex items-center">
                        Price
                        {sortBy === 'price' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                            <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => toggleSort('inventory')}
                    >
                      <div className="flex items-center">
                        Inventory
                        {sortBy === 'inventory' && (
                          sortDirection === 'asc' ? 
                            <ArrowUpIcon className="ml-1 h-4 w-4" /> : 
                            <ArrowDownIcon className="ml-1 h-4 w-4" />
                        )}
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-md object-cover" src={product.imageUrl} alt={product.name} />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{product.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.category}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatPrice(product.price)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {product.inventory === 999 ? 'Unlimited' : product.inventory}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {product.status.charAt(0).toUpperCase() + product.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/client-dashboard/products/${product.id}`}
                            className="text-indigo-600 hover:text-indigo-900 p-1"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </Link>
                          <button className="text-red-600 hover:text-red-900 p-1">
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
