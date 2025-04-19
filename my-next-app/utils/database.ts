import { supabaseAdmin } from './supabase';

// Database utility functions for the MVP

// Businesses
export const BusinessService = {
  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async getByOwnerId(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .select('*')
      .eq('owner_id', ownerId);
      
    if (error) throw error;
    return data;
  },
  
  async create(business: any) {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .insert(business)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('businesses')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Conversations
export const ConversationService = {
  async getByBusinessId(businessId: string) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*, messages(count)')
      .eq('business_id', businessId)
      .order('updated_at', { ascending: false });
      
    if (error) throw error;
    return data;
  },
  
  async getById(id: string) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async findOrCreate(businessId: string, customerPhone: string) {
    // First try to find existing conversation
    const { data: existing, error: findError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('business_id', businessId)
      .eq('customer_phone', customerPhone)
      .eq('status', 'active')
      .single();
      
    if (existing) return existing;
    
    if (findError && findError.code !== 'PGRST116') {
      // Error other than "no rows returned"
      throw findError;
    }
    
    // Create new conversation if none exists
    const { data: newConvo, error: createError } = await supabaseAdmin
      .from('conversations')
      .insert({
        business_id: businessId,
        customer_phone: customerPhone,
        status: 'active'
      })
      .select()
      .single();
      
    if (createError) throw createError;
    return newConvo;
  },
  
  async updateLastMessage(id: string, lastMessage: string) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message: lastMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
      
    if (error) throw error;
    return data;
  }
};

// Messages
export const MessageService = {
  async getByConversationId(conversationId: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
      
    if (error) throw error;
    return data;
  },
  
  async create(message: any) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert(message)
      .select()
      .single();
      
    if (error) throw error;
    
    // Update conversation's last message
    if (message.content) {
      await ConversationService.updateLastMessage(message.conversation_id, message.content);
    }
    
    return data;
  }
};

// Products
export const ProductService = {
  async getByBusinessId(businessId: string) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .eq('business_id', businessId)
      .order('name', { ascending: true });
      
    if (error) throw error;
    return data;
  },
  
  async create(product: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .insert(product)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async update(id: string, updates: any) {
    const { data, error } = await supabaseAdmin
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Appointments
export const AppointmentService = {
  async getByBusinessId(businessId: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .select('*')
      .eq('business_id', businessId)
      .order('date', { ascending: true });
      
    if (error) throw error;
    return data;
  },
  
  async create(appointment: any) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .insert(appointment)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateStatus(id: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('appointments')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};

// Subscriptions (for SMB clients)
export const SubscriptionService = {
  async getByBusinessId(businessId: string) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },
  
  async create(subscription: any) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert(subscription)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  },
  
  async updateStatus(id: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
};
