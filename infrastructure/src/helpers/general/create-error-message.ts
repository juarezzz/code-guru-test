export const create_error_message = (error: string): string => {
  const formatted_message = `\`\`\`${error}\`\`\``;

  if (formatted_message.length > 3000) {
    return `\`\`\`${error.slice(0, 3000 - 9)}...\`\`\``;
  }

  return formatted_message;
};
