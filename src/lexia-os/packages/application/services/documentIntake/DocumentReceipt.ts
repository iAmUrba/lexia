import { DocumentReceiptProps, DocumentReceipt as IDocumentReceipt } from '../../../foundation/contracts/index.js';
import { Id } from '../../../foundation/id/index.js';
import { Clock } from '../../../foundation/clock/index.js';

export const DocumentReceipt = {
  create(props: Omit<DocumentReceiptProps, 'receiptId' | 'receivedAt'>): IDocumentReceipt {
    return Object.freeze({
      ...props,
      receiptId: Id.generate(),
      receivedAt: Clock.timestamp()
    });
  }
};
