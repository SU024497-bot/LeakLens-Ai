import React, { useState } from 'react';
import { 
  HelpCircle, BookOpen, ShieldAlert, CheckCircle2, 
  AlertTriangle, Wrench, ChevronDown, ChevronUp 
} from 'lucide-react';

export const HelpView: React.FC = () => {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const rulesDocumentation = [
    {
      category: 'Data Quality',
      rule: 'DQ_DUPLICATE_ROWS',
      title: 'Exact Duplicate Records',
      description: 'Evaluates identical rows across all columns. Duplicates artificially skew training loss and inflate metrics if randomly partitioned into validation sets.',
      limitation: 'Only tests exact cell equality; does not catch near-duplicates or typos.'
    },
    {
      category: 'Data Quality',
      rule: 'DQ_CONSTANT_COLUMNS',
      title: 'Constant / Zero-Variance Features',
      description: 'Identifies columns containing zero or only one unique value. Such features offer zero predictive information and should be pruned before modeling.',
      limitation: 'Calculated across the uploaded sample; rare values might appear in larger production distributions.'
    },
    {
      category: 'Data Quality',
      rule: 'DQ_HIGH_CARDINALITY_IDENTIFIERS',
      title: 'High-Cardinality Identifiers',
      description: 'Flags non-continuous features with unique ratios > 95% (e.g. account numbers, UUIDs). Including arbitrary IDs causes severe tree memorization and overfitting.',
      limitation: 'High cardinality is normal for continuous floating-point measurements; rule accounts for column nomenclature and type.'
    },
    {
      category: 'Data Leakage',
      rule: 'LEAK_EXACT_TARGET_DUPLICATION',
      title: 'Direct Target Duplication',
      description: 'Detects input features that possess identical element-wise values to the designated target column. Leads to trivial 100% accuracy during training.',
      limitation: 'Requires a designated target column.'
    },
    {
      category: 'Data Leakage',
      rule: 'LEAK_SUSPICIOUS_TARGET_CORRELATION',
      title: 'Suspicious Target Association',
      description: 'Computes Pearson |r|, Cramér’s V, or correlation ratio (eta) between features and the target. Scores >= 0.88 are flagged as likely proxies or post-event measurements.',
      limitation: 'High correlation can theoretically exist in physical deterministic processes; human verification of feature timing is required.'
    },
    {
      category: 'Data Leakage',
      rule: 'LEAK_POST_OUTCOME_FEATURE_NAMES',
      title: 'Post-Outcome Feature Names',
      description: 'Scans column names for tokens indicating data recorded post-event (e.g. cancellation_reason, payout, resolution_date, discharge_notes).',
      limitation: 'Heuristic check based on nomenclature; cannot detect lookahead if columns use obscure abbreviations.'
    },
    {
      category: 'Split Contamination',
      rule: 'LEAK_TRAIN_TEST_CONTAMINATION',
      title: 'Train / Test Partition Overlap',
      description: 'Performs inner join on training and holdout partitions to detect identical records appearing in both sets.',
      limitation: 'Only executable when a separate holdout partition is supplied.'
    }
  ];

  const faqs = [
    {
      q: 'Why does my CSV fail to parse or report encoding errors?',
      a: 'LeakLens AI automatically tries UTF-8, Latin-1, CP1252, and ISO-8859-1 encodings. If your CSV is exported from older systems, ensure it does not contain unescaped quotation marks or mismatched column delimiter counts in malformed rows.'
    },
    {
      q: 'Does LeakLens AI execute spreadsheet formulas in Excel files?',
      a: 'No. Excel workbooks are loaded with data_only=True via openpyxl. Formula evaluation is disabled for security and sandboxing; only the pre-computed cached cell values are ingested.'
    },
    {
      q: 'Why are target-dependent checks marked "UNAVAILABLE"?',
      a: 'Without a specified outcome variable, unsupervised algorithms cannot know which column is the target. Enter your target column name in the upload form to enable target duplication and correlation checks.'
    },
    {
      q: 'How should I remediate a "Critical" leakage finding?',
      a: 'If a column is an exact duplicate or proxy of your target, remove it from your training feature matrix. If it is a post-outcome field (e.g. cancellation reason), verify with domain stakeholders whether that field is known at the exact millisecond when real predictions will be requested.'
    }
  ];

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-indigo-brand tracking-tight">
          Help, Heuristic Documentation & Troubleshooting
        </h2>
        <p className="text-xs sm:text-sm text-indigo-brand/70 mt-1">
          Reference guide for all audit rules, statistical thresholds, limitations, and common workflow questions.
        </p>
      </div>

      {/* Rules Encyclopedia */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-indigo-brand flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-indigo-brand" />
          <span>Audit Engine Rule Catalog</span>
        </h3>

        <div className="space-y-3">
          {rulesDocumentation.map((item) => (
            <div
              key={item.rule}
              className="p-4 rounded-xl bg-vanilla-card border border-vanilla-border space-y-2 shadow-subtle"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-brand text-vanilla-brand">
                    {item.category}
                  </span>
                  <h4 className="text-sm font-bold text-indigo-brand">
                    {item.title}
                  </h4>
                </div>
                <code className="text-xs font-mono text-indigo-brand/60">
                  {item.rule}
                </code>
              </div>

              <p className="text-xs text-indigo-brand/80 leading-relaxed">
                {item.description}
              </p>

              <div className="text-[11px] text-indigo-brand/60 pt-1 border-t border-vanilla-border/50">
                <strong className="text-indigo-brand">Known Limitation: </strong>
                <span>{item.limitation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ & Troubleshooting Accordion */}
      <div className="space-y-4 pt-4">
        <h3 className="text-base font-bold text-indigo-brand flex items-center gap-2">
          <Wrench className="w-4 h-4 text-indigo-brand" />
          <span>Frequently Asked Questions & Troubleshooting</span>
        </h3>

        <div className="space-y-2.5">
          {faqs.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl bg-vanilla-card border border-vanilla-border overflow-hidden transition-all shadow-subtle"
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left font-bold text-xs text-indigo-brand flex items-center justify-between gap-4 select-none"
                >
                  <span>{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-indigo-brand/60 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-indigo-brand/60 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-indigo-brand/80 leading-relaxed border-t border-vanilla-border/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
