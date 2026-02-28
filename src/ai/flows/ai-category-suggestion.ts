'use server';
/**
 * @fileOverview This file defines a Genkit flow for suggesting an environmental issue category based on an image.
 *
 * - aiCategorySuggestion - A function that handles the AI category suggestion process.
 * - AICategorySuggestionInput - The input type for the aiCategorySuggestion function.
 * - AICategorySuggestionOutput - The return type for the aiCategorySuggestion function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AICategorySuggestionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an environmental issue, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type AICategorySuggestionInput = z.infer<typeof AICategorySuggestionInputSchema>;

const AICategorySuggestionOutputSchema = z.object({
  aiCategory: z.string().describe('The suggested category for the environmental issue based on the image.'),
});
export type AICategorySuggestionOutput = z.infer<typeof AICategorySuggestionOutputSchema>;

export async function aiCategorySuggestion(input: AICategorySuggestionInput): Promise<AICategorySuggestionOutput> {
  return aiCategorySuggestionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiCategorySuggestionPrompt',
  input: {schema: AICategorySuggestionInputSchema},
  output: {schema: AICategorySuggestionOutputSchema},
  // Using gemini-1.5-flash as it is the standard for fast and reliable vision classification
  model: 'googleai/gemini-1.5-flash',
  prompt: `You are an expert environmental analyst. Your task is to analyze the provided image of an environmental issue and suggest the most relevant and concise category.

Examples of categories include: "Litter", "Illegal Dumping", "Water Pollution", "Air Pollution", "Graffiti", "Damaged Infrastructure", "Deforestation", "Erosion", "Animal Harm".

Please provide only one category name. Do not add any other text, conversational filler, or explanation. The output must strictly follow the JSON schema provided.

Image: {{media url=photoDataUri}}`,
});

const aiCategorySuggestionFlow = ai.defineFlow(
  {
    name: 'aiCategorySuggestionFlow',
    inputSchema: AICategorySuggestionInputSchema,
    outputSchema: AICategorySuggestionOutputSchema,
  },
  async input => {
    try {
      const {output} = await prompt(input);
      if (!output) throw new Error('AI returned no output');
      return output;
    } catch (error) {
      console.error('AI Suggestion Flow Error:', error);
      // Fallback to a safe default if the model fails
      return { aiCategory: 'Litter' };
    }
  }
);
