'use server';
/**
 * @fileOverview A Genkit flow for generating custom passwords based on user-defined criteria.
 *
 * - generateCustomPassword - A function that handles the password generation process.
 * - GenerateCustomPasswordInput - The input type for the generateCustomPassword function.
 * - GenerateCustomPasswordOutput - The return type for the generateCustomPassword function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCustomPasswordInputSchema = z.object({
  length: z.number().int().min(8).max(128).describe('The total length of the password.'),
  minSpecialChars: z.number().int().min(0).describe('The minimum number of special characters required in the password.'),
  minUppercase: z.number().int().min(0).describe('The minimum number of uppercase letters required in the password.'),
  minLowercase: z.number().int().min(0).describe('The minimum number of lowercase letters required in the password.'),
  minDigits: z.number().int().min(0).describe('The minimum number of digits required in the password.'),
}).refine(
  (data) => data.minSpecialChars + data.minUppercase + data.minLowercase + data.minDigits <= data.length,
  {
    message: 'The sum of minimum character types must not exceed the total password length.',
    path: ['length'],
  }
);
export type GenerateCustomPasswordInput = z.infer<typeof GenerateCustomPasswordInputSchema>;

const GenerateCustomPasswordOutputSchema = z.object({
  password: z.string().describe('The randomly generated password conforming to the specified criteria.'),
});
export type GenerateCustomPasswordOutput = z.infer<typeof GenerateCustomPasswordOutputSchema>;

export async function generateCustomPassword(input: GenerateCustomPasswordInput): Promise<GenerateCustomPasswordOutput> {
  return generateCustomPasswordFlow(input);
}

const generatePasswordPrompt = ai.definePrompt({
  name: 'generatePasswordPrompt',
  input: { schema: GenerateCustomPasswordInputSchema },
  output: { schema: GenerateCustomPasswordOutputSchema },
  prompt: `You are a secure password generator. Your task is to create a strong, random password based on the user's specific requirements.
The output MUST be a JSON object conforming to the following schema:
```json
{{jsonSchema GenerateCustomPasswordOutputSchema}}
```

The password must strictly adhere to the following criteria:
- Total length: {{{length}}} characters.
- Minimum special characters: {{{minSpecialChars}}} (use characters like !@#$%^&*()-_+=[]{}|;:,.<>/?).
- Minimum uppercase letters: {{{minUppercase}}}.
- Minimum lowercase letters: {{{minLowercase}}}.
- Minimum digits: {{{minDigits}}}.

The password should contain only ASCII characters. Ensure the password is entirely random and unpredictable.
Do NOT include any other text, explanation, or formatting in your response, apart from the JSON object.`,
});

const generateCustomPasswordFlow = ai.defineFlow(
  {
    name: 'generateCustomPasswordFlow',
    inputSchema: GenerateCustomPasswordInputSchema,
    outputSchema: GenerateCustomPasswordOutputSchema,
  },
  async (input) => {
    const { output } = await generatePasswordPrompt(input);
    if (!output?.password) {
      throw new Error('Failed to generate password with required format.');
    }
    return output;
  }
);
