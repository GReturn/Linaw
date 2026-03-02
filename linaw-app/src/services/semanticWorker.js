import { pipeline, env } from '@xenova/transformers';

// Disable sending telemetry or downloading remote code
env.allowLocalModels = false;
env.useBrowserCache = true;

class SemanticVerifier {
    static model = "Xenova/mobilebert-uncased-mnli";
    static instance = null;

    static async getInstance(progress_callback = null) {
        if (this.instance === null) {
            this.instance = pipeline("zero-shot-classification", this.model, {
                progress_callback,
            });
        }
        return this.instance;
    }
}

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
    const { text } = event.data;
    if (!text) return;

    try {
        // Notify that we are loading/analyzing
        self.postMessage({ status: 'analyzing' });

        // Load the model (caches on first run)
        const classifier = await SemanticVerifier.getInstance((data) => {
            // TODO: Optional: send progress updates (e.g. download progress)
            // self.postMessage({ status: 'progress', data });
            console.log('Model progress:', data);
        });

        // We want to classify if this is a valid English phrase
        // vs completely random gibberish or non-sentient typing.
        // NLI models classify into labels based on entailment/contradiction with a hypothesis.
        // Zero-shot uses a template like "This example is {label}."

        const candidate_labels = [
            "a meaningful phrase or word",
            "random characters or gibberish",
        ];

        const result = await classifier(text, candidate_labels, {
            multi_label: false // We want the most likely label
        });

        // Expected result: { sequence: "...", labels: [...], scores: [...] }
        const topLabel = result.labels[0];
        const topScore = result.scores[0];

        const isMeaningful = topLabel === "a meaningful phrase or word" && topScore > 0.55;

        self.postMessage({
            status: 'complete',
            text,
            isMeaningful,
            details: result
        });
    } catch (err) {
        console.error("Semantic ML Worker Error:", err);
        self.postMessage({ status: 'error', error: err.message });
    }
});
