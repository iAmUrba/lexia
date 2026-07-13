import { Document } from '@lexia/domain';
import { CaseHeaderView, ValidationReport } from '../contracts/index.js';
import { CaseHeaderProjector } from '../projectors/CaseHeaderProjector.js';
import { DocumentValidator } from '../validators/DocumentValidator.js';

export interface CaseHeaderQueryResult {
  readonly view: CaseHeaderView;
  readonly validation: ValidationReport;
}

export class GetCaseHeader {
  private projector: CaseHeaderProjector;
  private validator: DocumentValidator;

  constructor(projector: CaseHeaderProjector, validator: DocumentValidator) {
    this.projector = projector;
    this.validator = validator;
  }

  execute(document: Document): CaseHeaderQueryResult {
    const view = this.projector.project(document);
    const validation = this.validator.validate(document);

    return {
      view,
      validation
    };
  }
}
