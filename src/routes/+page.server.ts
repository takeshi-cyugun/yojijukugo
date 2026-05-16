import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
    const apiUrl = 'http://localhost:3000/api/all';
    console.error(`[DEBUG] Fetch start: ${apiUrl}`.substring(0, 200));

    let response;
    try {
        response = await fetch(apiUrl);
    } catch (e: any) {
        console.error(`[ERROR] Connection failed: ${e.message}`.substring(0, 200));
        return { quizzes: [], error: 'Fetch execution failed' };
    }

    console.error(`[DEBUG] HTTP Status: ${response.status}`.substring(0, 200));

    const rawText = await response.text();
    const truncatedBody = rawText.substring(0, 200);
    console.error(`[DEBUG] Body: "${truncatedBody}${rawText.length > 200 ? '...' : ''}"`);

    if (!response.ok) {
        if (response.status === 404) {
            console.error('[ADVICE] Go server on port 3000 returned 404. Is the Go backend actually running?'.substring(0, 200));
        }
        console.error(`[ERROR] Status ${response.status}: ${truncatedBody}`.substring(0, 200));
        return { quizzes: [], error: 'Backend server error' };
    }

    try {
        const data = JSON.parse(rawText);
        console.error(`[DEBUG] Success! Count: ${data.length}`.substring(0, 200));
        return { quizzes: data };
    } catch (err) {
        console.error(`[ERROR] JSON Parse Fail: ${String(err)}`.substring(0, 200));
        return { quizzes: [], error: 'Invalid JSON format' };
    }
};