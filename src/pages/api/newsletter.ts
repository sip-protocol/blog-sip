import type { APIRoute } from 'astro'

export const prerender = false

const BUTTONDOWN_API_KEY = import.meta.env.BUTTONDOWN_API_KEY

interface ButtondownResponse {
  id?: string
  email?: string
  creation_date?: string
  subscriber_type?: string
  code?: string
  detail?: string
}

export const POST: APIRoute = async ({ request }) => {
  // Check for API key
  if (!BUTTONDOWN_API_KEY) {
    console.error('BUTTONDOWN_API_KEY not configured')
    return new Response(
      JSON.stringify({ error: 'Newsletter service not configured' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Subscribe via Buttondown API
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${BUTTONDOWN_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        tags: ['blog'],
      }),
    })

    const data: ButtondownResponse = await response.json()

    if (!response.ok) {
      // Handle specific Buttondown errors
      if (data.code === 'email_already_exists') {
        return new Response(
          JSON.stringify({ error: 'This email is already subscribed' }),
          { status: 409, headers: { 'Content-Type': 'application/json' } }
        )
      }

      console.error('Buttondown error:', data)
      return new Response(
        JSON.stringify({ error: data.detail || 'Subscription failed' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Successfully subscribed! Check your email to confirm.',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Newsletter subscription error:', err)
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
