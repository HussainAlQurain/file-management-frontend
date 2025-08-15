import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ResourceTypeDuplicationService } from './resource-type-duplication.service';
import { ConfigService } from './config.service';
import { ResourceTypeDuplicationResultDto, ResourceTypeDuplicationRequestDto } from '../models/bulk-import.model';

describe('ResourceTypeDuplicationService', () => {
  let service: ResourceTypeDuplicationService;
  let httpMock: HttpTestingController;
  let configService: jasmine.SpyObj<ConfigService>;

  const mockApiBase = 'http://localhost:8080/api';

  beforeEach(() => {
    const configSpy = jasmine.createSpyObj('ConfigService', [], {
      apiBase: mockApiBase
    });

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ResourceTypeDuplicationService,
        { provide: ConfigService, useValue: configSpy }
      ]
    });

    service = TestBed.inject(ResourceTypeDuplicationService);
    httpMock = TestBed.inject(HttpTestingController);
    configService = TestBed.inject(ConfigService) as jasmine.SpyObj<ConfigService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('duplicateToCompany', () => {
    it('should duplicate resource type to single company', () => {
      const resourceTypeId = 1;
      const targetCompanyId = 2;
      const mockResult: ResourceTypeDuplicationResultDto = {
        sourceResourceTypeId: 1,
        sourceResourceTypeCode: 'TEST_TYPE',
        sourceResourceTypeName: 'Test Resource Type',
        sourceCompanyId: 1,
        sourceCompanyName: 'Source Company',
        targetResourceTypeId: 2,
        targetResourceTypeCode: 'TEST_TYPE',
        targetResourceTypeName: 'Test Resource Type',
        targetCompanyId: 2,
        targetCompanyName: 'Target Company',
        successful: true,
        duplicatedFieldsCount: 3,
        duplicatedOptionsCount: 5
      };

      service.duplicateToCompany(resourceTypeId, targetCompanyId).subscribe(result => {
        expect(result).toEqual(mockResult);
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/duplicate?targetCompanyId=2`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResult);
    });

    it('should handle duplication failure', () => {
      const resourceTypeId = 1;
      const targetCompanyId = 2;
      const mockResult: ResourceTypeDuplicationResultDto = {
        sourceResourceTypeId: 1,
        sourceResourceTypeCode: '',
        sourceResourceTypeName: '',
        sourceCompanyId: 0,
        sourceCompanyName: '',
        targetResourceTypeId: 0,
        targetResourceTypeCode: '',
        targetResourceTypeName: '',
        targetCompanyId: 2,
        targetCompanyName: '',
        successful: false,
        errorMessage: 'Resource type not found',
        duplicatedFieldsCount: 0,
        duplicatedOptionsCount: 0
      };

      service.duplicateToCompany(resourceTypeId, targetCompanyId).subscribe(result => {
        expect(result).toEqual(mockResult);
        expect(result.successful).toBeFalse();
        expect(result.errorMessage).toBe('Resource type not found');
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/duplicate?targetCompanyId=2`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResult);
    });
  });

  describe('duplicateToMultipleCompanies', () => {
    it('should duplicate resource type to multiple companies', () => {
      const resourceTypeId = 1;
      const targetCompanyIds = [2, 3];
      const mockResults: ResourceTypeDuplicationResultDto[] = [
        {
          sourceResourceTypeId: 1,
          sourceResourceTypeCode: 'TEST_TYPE',
          sourceResourceTypeName: 'Test Resource Type',
          sourceCompanyId: 1,
          sourceCompanyName: 'Source Company',
          targetResourceTypeId: 2,
          targetResourceTypeCode: 'TEST_TYPE',
          targetResourceTypeName: 'Test Resource Type',
          targetCompanyId: 2,
          targetCompanyName: 'Target Company 1',
          successful: true,
          duplicatedFieldsCount: 3,
          duplicatedOptionsCount: 5
        },
        {
          sourceResourceTypeId: 1,
          sourceResourceTypeCode: 'TEST_TYPE',
          sourceResourceTypeName: 'Test Resource Type',
          sourceCompanyId: 1,
          sourceCompanyName: 'Source Company',
          targetResourceTypeId: 3,
          targetResourceTypeCode: 'TEST_TYPE',
          targetResourceTypeName: 'Test Resource Type',
          targetCompanyId: 3,
          targetCompanyName: 'Target Company 2',
          successful: true,
          duplicatedFieldsCount: 3,
          duplicatedOptionsCount: 5
        }
      ];

      service.duplicateToMultipleCompanies(resourceTypeId, targetCompanyIds).subscribe(results => {
        expect(results).toEqual(mockResults);
        expect(results.length).toBe(2);
        expect(results.every(r => r.successful)).toBeTrue();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/duplicate-multiple?targetCompanyIds=2&targetCompanyIds=3`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toBeNull();
      req.flush(mockResults);
    });

    it('should handle partial success in multiple company duplication', () => {
      const resourceTypeId = 1;
      const targetCompanyIds = [2, 3];
      const mockResults: ResourceTypeDuplicationResultDto[] = [
        {
          sourceResourceTypeId: 1,
          sourceResourceTypeCode: 'TEST_TYPE',
          sourceResourceTypeName: 'Test Resource Type',
          sourceCompanyId: 1,
          sourceCompanyName: 'Source Company',
          targetResourceTypeId: 2,
          targetResourceTypeCode: 'TEST_TYPE',
          targetResourceTypeName: 'Test Resource Type',
          targetCompanyId: 2,
          targetCompanyName: 'Target Company 1',
          successful: true,
          duplicatedFieldsCount: 3,
          duplicatedOptionsCount: 5
        },
        {
          sourceResourceTypeId: 1,
          sourceResourceTypeCode: '',
          sourceResourceTypeName: '',
          sourceCompanyId: 1,
          sourceCompanyName: '',
          targetResourceTypeId: 0,
          targetResourceTypeCode: '',
          targetResourceTypeName: '',
          targetCompanyId: 3,
          targetCompanyName: '',
          successful: false,
          errorMessage: 'Company not found',
          duplicatedFieldsCount: 0,
          duplicatedOptionsCount: 0
        }
      ];

      service.duplicateToMultipleCompanies(resourceTypeId, targetCompanyIds).subscribe(results => {
        expect(results).toEqual(mockResults);
        expect(results.length).toBe(2);
        expect(results[0].successful).toBeTrue();
        expect(results[1].successful).toBeFalse();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/duplicate-multiple?targetCompanyIds=2&targetCompanyIds=3`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResults);
    });
  });

  describe('bulkDuplicate', () => {
    it('should handle bulk duplication requests', () => {
      const requests: ResourceTypeDuplicationRequestDto[] = [
        {
          sourceResourceTypeId: 1,
          targetCompanyIds: [2, 3],
          overwriteExisting: false
        },
        {
          sourceResourceTypeId: 2,
          targetCompanyIds: [3],
          overwriteExisting: true
        }
      ];

      const mockResults: ResourceTypeDuplicationResultDto[] = [
        {
          sourceResourceTypeId: 1,
          sourceResourceTypeCode: 'TEST_TYPE_1',
          sourceResourceTypeName: 'Test Resource Type 1',
          sourceCompanyId: 1,
          sourceCompanyName: 'Source Company',
          targetResourceTypeId: 3,
          targetResourceTypeCode: 'TEST_TYPE_1',
          targetResourceTypeName: 'Test Resource Type 1',
          targetCompanyId: 2,
          targetCompanyName: 'Target Company 1',
          successful: true,
          duplicatedFieldsCount: 2,
          duplicatedOptionsCount: 3
        }
      ];

      service.bulkDuplicate(requests).subscribe(results => {
        expect(results).toEqual(mockResults);
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/bulk-duplicate`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(requests);
      req.flush(mockResults);
    });
  });

  describe('canDuplicateToCompany', () => {
    it('should check if duplication is possible', () => {
      const resourceTypeId = 1;
      const targetCompanyId = 2;

      service.canDuplicateToCompany(resourceTypeId, targetCompanyId).subscribe(result => {
        expect(result).toBeTrue();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/can-duplicate?targetCompanyId=2`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('should return false when duplication is not possible', () => {
      const resourceTypeId = 1;
      const targetCompanyId = 2;

      service.canDuplicateToCompany(resourceTypeId, targetCompanyId).subscribe(result => {
        expect(result).toBeFalse();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/1/can-duplicate?targetCompanyId=2`);
      expect(req.request.method).toBe('GET');
      req.flush(false);
    });
  });

  describe('resourceTypeExistsInCompany', () => {
    it('should check if resource type exists in company', () => {
      const resourceTypeCode = 'TEST_TYPE';
      const companyId = 2;

      service.resourceTypeExistsInCompany(resourceTypeCode, companyId).subscribe(result => {
        expect(result).toBeTrue();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/exists?resourceTypeCode=TEST_TYPE&companyId=2`);
      expect(req.request.method).toBe('GET');
      req.flush(true);
    });

    it('should return false when resource type does not exist', () => {
      const resourceTypeCode = 'NONEXISTENT_TYPE';
      const companyId = 2;

      service.resourceTypeExistsInCompany(resourceTypeCode, companyId).subscribe(result => {
        expect(result).toBeFalse();
      });

      const req = httpMock.expectOne(`${mockApiBase}/resource-types/exists?resourceTypeCode=NONEXISTENT_TYPE&companyId=2`);
      expect(req.request.method).toBe('GET');
      req.flush(false);
    });
  });
});
