import type { APIRoute } from 'astro';

export const post: APIRoute = async ({ request, redirect }) => {
  const formData = await request.formData();
  const name = formData.get('name')?.toString() || '';
  const email = formData.get('email')?.toString() || '';
  const message = formData.get('message')?.toString() || '';

  // TODO: Integrate with email service (e.g., SendGrid, Mailgun)
  console.log('Contact form submission:', { name, email, message });

  // Redirect back with a success query param
  return redirect(request.url + '?success=true');
};
