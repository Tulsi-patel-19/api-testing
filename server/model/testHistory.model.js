import mongoose from "mongoose";

const testHistorySchema = new mongoose.Schema({
    apiurl: {
        type: String,
        required: true
    },
    cacheStatus: {
        type: String,
        enum: ["HIT", "MISS"],
        required: true
    },
    responseTime: {
        type: Number,
        required: true
    },
    apiCalled: {
        type: Boolean,
        required: true
    },
    success: {
        type: Boolean,
        default: true
    },
    errorMessage: {
        type: String,
        default: ""
    }
}, {
    timestamps: true
});

const TestHistory = mongoose.model("TestHistory", testHistorySchema);

export default TestHistory;
