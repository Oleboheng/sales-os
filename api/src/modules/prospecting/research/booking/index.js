const bookingResearch = {
    type: 'BOOKING_SYSTEM',
    table: null,
    joinField: null,
    fields: [],
    defaultValues: {},
    getCompletionErrors: () => [],
    getTypeSpecificResearch: async () => ({}),
    saveTypeSpecificResearch: async () => null
};

export default bookingResearch;
