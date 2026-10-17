import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { Role } from '@prisma/client';
import { CategoryRepository } from '../../src/repositories/category.repository.js';
import {
  resolveSubmissionCategory,
  VideoCategoryService,
} from '../../src/services/video-category.service.js';
import { ConflictError, ValidationError } from '../../src/utils/response.js';

const ADMIN = { id: 'aaaaaaaa-aaaa-4aaa-8aaa-000000000001', role: Role.ADMIN };
const CATEGORY_ID = 'cccccccc-cccc-4ccc-8ccc-000000000001';

function row(overrides: Partial<{ id: string; name: string; slug: string; isActive: boolean }> = {}) {
  const now = new Date('2026-10-17T00:00:00.000Z');
  return {
    id: overrides.id ?? CATEGORY_ID,
    name: overrides.name ?? 'Tricks',
    slug: overrides.slug ?? 'tricks',
    description: null,
    isActive: overrides.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
}

describe('video categories', () => {
  const original = {
    findById: CategoryRepository.findById,
    findBySlug: CategoryRepository.findBySlug,
    findByNameInsensitive: CategoryRepository.findByNameInsensitive,
    create: CategoryRepository.create,
    countReferences: CategoryRepository.countReferences,
    deleteById: CategoryRepository.deleteById,
  };

  beforeEach(() => {
    CategoryRepository.findBySlug = async () => null;
    CategoryRepository.findByNameInsensitive = async () => null;
    CategoryRepository.findById = async () => null;
    CategoryRepository.countReferences = async () => ({ submissions: 0, contests: 0 });
    CategoryRepository.deleteById = async () => undefined;
  });

  afterEach(() => {
    CategoryRepository.findById = original.findById;
    CategoryRepository.findBySlug = original.findBySlug;
    CategoryRepository.findByNameInsensitive = original.findByNameInsensitive;
    CategoryRepository.create = original.create;
    CategoryRepository.countReferences = original.countReferences;
    CategoryRepository.deleteById = original.deleteById;
  });

  it('rejects a duplicate category name', async () => {
    CategoryRepository.findByNameInsensitive = async () => row();
    await assert.rejects(
      () => VideoCategoryService.create(ADMIN, { name: ' tricks ' }),
      (error: unknown) => error instanceof ConflictError,
    );
  });

  it('refuses to delete a category that submissions still use', async () => {
    CategoryRepository.findById = async () => row();
    CategoryRepository.countReferences = async () => ({ submissions: 2, contests: 0 });
    let deleted = false;
    CategoryRepository.deleteById = async () => {
      deleted = true;
    };
    await assert.rejects(
      () => VideoCategoryService.remove(ADMIN, CATEGORY_ID),
      (error: unknown) => error instanceof ConflictError,
    );
    assert.equal(deleted, false);
  });

  it('stores Other as free text and does not require a category row', async () => {
    const resolved = await resolveSubmissionCategory({ otherCategoryLabel: '  Dock diving  ' });
    assert.deepEqual(resolved, { categoryId: null, otherCategoryLabel: 'Dock diving' });
  });

  it('rejects an inactive official category and a blank choice', async () => {
    CategoryRepository.findById = async () => row({ isActive: false });
    await assert.rejects(
      () => resolveSubmissionCategory({ categoryId: CATEGORY_ID }),
      (error: unknown) => error instanceof ValidationError,
    );
    await assert.rejects(
      () => resolveSubmissionCategory({ categoryId: CATEGORY_ID, otherCategoryLabel: 'Tricks' }),
      (error: unknown) => error instanceof ValidationError,
    );
    await assert.rejects(
      () => resolveSubmissionCategory({}),
      (error: unknown) => error instanceof ValidationError,
    );
  });

  it('accepts an active official category', async () => {
    CategoryRepository.findById = async () => row();
    const resolved = await resolveSubmissionCategory({ categoryId: CATEGORY_ID });
    assert.deepEqual(resolved, { categoryId: CATEGORY_ID, otherCategoryLabel: null });
  });
});
