import { EmbeddingService, SemanticEngine, cosineSimilarity } from '../ai/semanticEngine';
import { BrandGuideline, ApprovedSource } from '@prisma/client';

describe('Semantic RAG & Vector Embedding Engine Tests', () => {
  test('Local vector embedding generation produces normalized unit vectors (L2 norm = 1.0)', async () => {
    const text = 'NovaTech Pulse delivers enterprise-grade real-time collaboration with seamless workflows.';
    const vector = await EmbeddingService.getEmbedding(text);

    expect(vector.length).toBe(128);

    // Compute L2 norm
    let sumSq = 0;
    for (const v of vector) {
      sumSq += v * v;
    }
    const norm = Math.sqrt(sumSq);
    expect(norm).toBeCloseTo(1.0, 4);
  });

  test('Cosine similarity accurately discriminates semantic tone and vocabulary clusters', () => {
    // Two informal/slang snippets
    const slangA = EmbeddingService.generateLocalDenseVector('gonna wanna awesome dude super cool');
    const slangB = EmbeddingService.generateLocalDenseVector('wanna cool awesome super dude yeah');

    // Formal enterprise snippet
    const formal = EmbeddingService.generateLocalDenseVector('enterprise-grade governance compliance structured scalable authoritative');

    const similaritySlang = cosineSimilarity(slangA, slangB);
    const similarityCross = cosineSimilarity(slangA, formal);

    expect(similaritySlang).toBeGreaterThan(0.70);
    expect(similarityCross).toBeLessThan(0.40);
  });

  test('SemanticEngine flags non-verbatim contextual tone deviations against brand guidelines', async () => {
    const guidelines: BrandGuideline[] = [
      {
        id: 'g-tone',
        workspaceId: 'w-test',
        title: 'Professional Corporate Tone',
        category: 'BRAND_VOICE',
        severity: 'HIGH',
        description: 'Maintain formal enterprise voice and avoid street slang or overly casual phrasing.',
        ruleDetails: 'Do not use informal street slang or extreme casual hyperbole.',
        examplesToAvoid: JSON.stringify(['super cool awesome dude hella crappy']),
        preferredReplacements: JSON.stringify({ 'super cool': 'highly capable' }),
        isActive: true,
        version: 1,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const sources: ApprovedSource[] = [];

    // Content does not verbatim match the avoid list, but shares semantic slang vector cluster
    const content = 'Our new platform update is gonna be super cool and awesome for all team members.';

    const findings = await SemanticEngine.analyzeWithEmbeddings({
      content,
      guidelines,
      sources,
    });

    expect(findings.length).toBeGreaterThan(0);
    expect(findings[0].category).toBe('BRAND_VOICE');
    expect(findings[0].guidelineRef).toContain('Semantic RAG');
  });
});
