import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Disclosure } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';
import { BsFillChatDotsFill, BsCalendarCheck, BsShop, BsWhatsapp } from 'react-icons/bs';

// Feature section data
const features = [
  {
    name: 'AI-Powered WhatsApp & SMS',
    description: 'Intelligent automation for WhatsApp and SMS communications. Engage with customers 24/7 without lifting a finger.',
    icon: BsWhatsapp,
  },
  {
    name: 'Product & Service Catalog',
    description: 'Showcase your offerings directly through messaging. Let customers browse and inquire about your products without leaving their chat.',
    icon: BsShop,
  },
  {
    name: 'Smart Appointment Booking',
    description: 'Automated scheduling that syncs with your calendar. Let your AI assistant handle booking, rescheduling, and reminders.',
    icon: BsCalendarCheck,
  },
  {
    name: 'Conversational Marketing',
    description: 'Build meaningful customer relationships through natural conversations. Let AI personalize each interaction based on customer history.',
    icon: BsFillChatDotsFill,
  },
];

// FAQ section data
const faqs = [
  {
    question: 'How does BizChatAssist work with my existing WhatsApp?',
    answer: 'BizChatAssist integrates seamlessly with WhatsApp Business API. Once set up, your customers interact with your business as usual, but now with AI-powered responses and capabilities.',
  },
  {
    question: 'Do I need technical knowledge to set this up?',
    answer: 'Not at all! Our onboarding team handles the entire setup process for you. We\'ll configure your account, train the AI with your business information, and ensure everything works perfectly.',
  },
  {
    question: 'How does the AI know what to say about my business?',
    answer: 'During onboarding, we\'ll gather information about your products, services, business hours, and common customer questions. The AI uses this information to provide accurate responses tailored to your business.',
  },
  {
    question: 'Can I customize the AI responses?',
    answer: 'Absolutely! You have full control over your AI assistant\'s tone, knowledge, and responses. Our dashboard allows you to review conversations and adjust AI behavior as needed.',
  },
  {
    question: 'What if the AI can\'t answer a customer\'s question?',
    answer: 'The AI will recognize when it doesn\'t have enough information and will gracefully escalate the conversation to a human team member, ensuring customers always get accurate information.',
  },
];

// Pricing section data
const pricing = [
  {
    name: 'Starter',
    price: '$49',
    description: 'Perfect for small businesses just getting started with automation',
    features: [
      'AI-powered WhatsApp automation',
      'Up to 1,000 messages per month',
      'Basic product catalog',
      'Simple appointment scheduling',
      'Email support',
    ],
    cta: 'Get Started',
    mostPopular: false,
  },
  {
    name: 'Professional',
    price: '$99',
    description: 'Ideal for growing businesses with active customer communications',
    features: [
      'Everything in Starter',
      'Up to 5,000 messages per month',
      'Advanced product catalog with images',
      'Full appointment scheduling system',
      'Custom AI training',
      'Priority support',
    ],
    cta: 'Get Started',
    mostPopular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For businesses with high-volume communication needs',
    features: [
      'Everything in Professional',
      'Unlimited messages',
      'Multiple WhatsApp numbers',
      'Advanced analytics and insights',
      'Custom integrations',
      'Dedicated account manager',
    ],
    cta: 'Contact Sales',
    mostPopular: false,
  },
];

export default function Home() {
  return (
    <div className="bg-white">
      <Head>
        <title>BizChatAssist | AI-Powered Communication for SMBs</title>
        <meta
          name="description"
          content="Automate WhatsApp and SMS communications with AI. Handle product inquiries, appointment scheduling, and customer support effortlessly."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header/Navigation */}
      <header className="fixed w-full bg-white z-50 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-2xl font-bold text-indigo-600">BizChatAssist</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <a href="#features" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Features
                </a>
                <a href="#pricing" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Pricing
                </a>
                <a href="#faq" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  FAQ
                </a>
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <Link href="/login" className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium">
                Log in
              </Link>
              <Link href="/signup" className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Sign up
              </Link>
            </div>
          </div>
        </nav>
      </header>

      <main>
        {/* Hero Section */}
        <div className="relative pt-16">
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gray-100" />
          <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div className="relative shadow-xl sm:rounded-2xl sm:overflow-hidden">
              <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-700 to-purple-800 mix-blend-multiply" />
              </div>
              <div className="relative px-4 py-12 sm:px-6 sm:py-16 lg:py-20 lg:px-8">
                <h1 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
                  <span className="block text-white">Automate Customer Conversations</span>
                  <span className="block text-indigo-200">with AI-Powered Messaging</span>
                </h1>
                <p className="mt-4 max-w-lg mx-auto text-center text-lg text-indigo-100 sm:max-w-2xl">
                  Transform how your business communicates. Let AI handle WhatsApp & SMS inquiries, 
                  schedule appointments, and showcase your products - 24/7 without lifting a finger.
                </p>
                <div className="mt-6 max-w-sm mx-auto sm:max-w-none sm:flex sm:justify-center">
                  <div className="space-y-3 sm:space-y-0 sm:mx-auto sm:inline-grid sm:grid-cols-2 sm:gap-5">
                    <Link href="/signup" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-700 bg-white hover:bg-indigo-50 sm:px-8">
                      Get started
                    </Link>
                    <a href="#demo" className="flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70 sm:px-8">
                      Live demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-indigo-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Everything You Need to Automate Customer Communication
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                BizChatAssist helps small-to-medium businesses automate and enhance customer interactions
                through intelligent messaging.
              </p>
            </div>

            <div className="mt-12">
              <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {features.map((feature) => (
                  <div key={feature.name} className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white">
                        <feature.icon className="h-6 w-6" aria-hidden="true" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">{feature.name}</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">{feature.description}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* Interactive Demo (Placeholder) */}
        <div id="demo" className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-extrabold text-gray-900 text-center">
              See BizChatAssist in Action
            </h2>
            <p className="mt-4 text-lg text-gray-500 text-center max-w-3xl mx-auto">
              Our AI assistant handles inquiries, schedules appointments, and showcases products - all through WhatsApp or SMS.
            </p>
            
            <div className="mt-8 bg-white rounded-lg shadow overflow-hidden max-w-2xl mx-auto">
              <div className="px-4 py-5 sm:px-6 bg-indigo-700 text-white">
                <h3 className="text-lg font-medium">WhatsApp Business Demo</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-sm">Hi, do you have any appointments available this weekend?</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-indigo-100 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-sm">Hi there! Yes, we have appointments available this weekend. We have slots on Saturday from 10 AM to 4 PM and Sunday from 12 PM to 5 PM. Would you like me to book an appointment for you?</p>
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-sm">Yes, I'd like Saturday at 2 PM. Do you have that available?</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-indigo-100 rounded-lg px-4 py-2 max-w-md">
                      <p className="text-sm">Saturday at 2 PM is available. May I have your name and contact information to complete the booking?</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex">
                    <input
                      type="text"
                      className="flex-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      placeholder="Type a message..."
                    />
                    <button
                      type="button"
                      className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Send
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">This is a simulation. Try BizChatAssist with your own WhatsApp Business account.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-base font-semibold text-indigo-600 tracking-wide uppercase">Pricing</h2>
              <p className="mt-2 text-3xl font-extrabold text-gray-900 sm:text-4xl lg:text-5xl">
                Plans for businesses of all sizes
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Choose the perfect plan for your needs. All plans include our core AI communication features.
              </p>
            </div>

            <div className="mt-12 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-6">
              {pricing.map((tier) => (
                <div key={tier.name} className={`relative p-8 bg-white border rounded-2xl shadow-sm flex flex-col ${tier.mostPopular ? 'ring-2 ring-indigo-600' : ''}`}>
                  {tier.mostPopular && (
                    <div className="absolute top-0 inset-x-0 transform -translate-y-1/2">
                      <div className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-indigo-100 text-indigo-600">
                        Most popular
                      </div>
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
                    <p className="mt-4 flex items-baseline text-gray-900">
                      <span className="text-5xl font-extrabold tracking-tight">{tier.price}</span>
                      {tier.price !== 'Custom' && <span className="ml-1 text-xl font-semibold">/month</span>}
                    </p>
                    <p className="mt-6 text-gray-500">{tier.description}</p>

                    <ul role="list" className="mt-6 space-y-6">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex">
                          <svg className="flex-shrink-0 w-6 h-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="ml-3 text-gray-500">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="#"
                    className={`
                      mt-8 block w-full py-3 px-6 border border-transparent rounded-md shadow
                      text-center font-medium
                      ${tier.mostPopular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                      }
                    `}
                  >
                    {tier.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="bg-gray-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto divide-y-2 divide-gray-200">
              <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
                Frequently asked questions
              </h2>
              <dl className="mt-6 space-y-6 divide-y divide-gray-200">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt className="text-lg">
                          <Disclosure.Button className="text-left w-full flex justify-between items-start text-gray-400">
                            <span className="font-medium text-gray-900">{faq.question}</span>
                            <span className="ml-6 h-7 flex items-center">
                              <ChevronDownIcon
                                className={`${open ? '-rotate-180' : 'rotate-0'} h-6 w-6 transform`}
                                aria-hidden="true"
                              />
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2 pr-12">
                          <p className="text-base text-gray-500">{faq.answer}</p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-indigo-800">
          <div className="max-w-2xl mx-auto text-center py-12 px-4 sm:py-14 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to automate your customer communications?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-indigo-200">
              Start handling inquiries, scheduling appointments, and showcasing products through AI-powered messaging.
            </p>
            <Link
              href="/signup"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-700 bg-white hover:bg-indigo-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                About
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Features
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Pricing
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Blog
              </a>
            </div>
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Contact
              </a>
            </div>
          </nav>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 BizChatAssist. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
