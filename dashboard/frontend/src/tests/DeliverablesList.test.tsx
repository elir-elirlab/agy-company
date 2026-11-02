// Unit tests for DeliverablesList component focusing on localized department sort buttons
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DeliverablesList } from '../components/DeliverablesList';
import { I18nProvider } from '../i18n/context';
import { DeliverableMeta, OrgChartData } from '../types';

describe('DeliverablesList Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const mockDeliverables: DeliverableMeta[] = [
    {
      id: 'note-1',
      title: 'Secretary Meeting Minutes',
      relative_path: '01_Inbox/2026-11-03-Secretary-Notes.md',
      department: '秘書室',
      tags: ['秘書室'],
      links: [],
      summary: ['Discussed quarterly plan']
    },
    {
      id: 'note-2',
      title: 'Backend Architecture Design',
      relative_path: '01_Inbox/engineering/2026-11-03-Backend-Arch.md',
      department: 'engineering',
      tags: ['engineering'],
      links: [],
      summary: ['Database schema finalized']
    }
  ];

  const mockOrgData: OrgChartData = {
    owner: {
      title: 'オーナー (Owner)',
      role: '事業推進',
      translations: {
        ja: { title: 'オーナー (Owner)', role: '事業推進' },
        en: { title: 'Owner', role: 'Business Strategy' }
      }
    },
    secretary: {
      title: '秘書室 (Executive Secretary)',
      role: '窓口対応',
      is_permanent: true,
      translations: {
        ja: { title: '秘書室 (Executive Secretary)', role: '窓口対応' },
        en: { title: 'Executive Secretary', role: 'Concierge' }
      }
    },
    departments: [
      {
        id: 'engineering',
        name: '開発部門 (Engineering)',
        role: 'アーキテクチャ設計',
        translations: {
          ja: { name: '開発部門 (Engineering)', role: 'アーキテクチャ設計' },
          en: { name: 'Engineering Department', role: 'Architecture Design' }
        },
        deliverables_count: 1,
        path: '01_Inbox/engineering'
      }
    ]
  };

  it('renders clean compact department button for 秘書室 when language is ja', () => {
    localStorage.setItem('agy_company_language', 'ja');

    render(
      <I18nProvider>
        <DeliverablesList
          deliverables={mockDeliverables}
          selectedDepartment={null}
          onSelectDepartment={vi.fn()}
          onOpenFile={vi.fn()}
          orgData={mockOrgData}
        />
      </I18nProvider>
    );

    // Verify that the secretary button uses the clean short name without emojis or parenthesized English
    const secretaryBtn = screen.getByRole('button', { name: '秘書室' });
    expect(secretaryBtn).toBeInTheDocument();
    expect(secretaryBtn).toHaveAttribute('title', '秘書室 (Executive Secretary)');

    // Verify that the engineering button uses the clean short name
    const engBtn = screen.getByRole('button', { name: '開発部門' });
    expect(engBtn).toBeInTheDocument();
    expect(engBtn).toHaveAttribute('title', '開発部門 (Engineering)');
  });

  it('renders clean compact department button for 秘書室 when language is en', () => {
    localStorage.setItem('agy_company_language', 'en');

    render(
      <I18nProvider>
        <DeliverablesList
          deliverables={mockDeliverables}
          selectedDepartment={null}
          onSelectDepartment={vi.fn()}
          onOpenFile={vi.fn()}
          orgData={mockOrgData}
        />
      </I18nProvider>
    );

    // Verify that the secretary button dynamically switches to the compact English name without emojis
    const secretaryBtn = screen.getByRole('button', { name: 'Secretary' });
    expect(secretaryBtn).toBeInTheDocument();
    expect(secretaryBtn).toHaveAttribute('title', 'Executive Secretary');

    // Verify that the engineering button dynamically switches to the compact English name without 'Department'
    const engBtn = screen.getByRole('button', { name: 'Engineering' });
    expect(engBtn).toBeInTheDocument();
    expect(engBtn).toHaveAttribute('title', 'Engineering Department');
  });

  it('invokes onSelectDepartment when clicking on a localized sort button', () => {
    localStorage.setItem('agy_company_language', 'en');
    const onSelectDeptMock = vi.fn();

    render(
      <I18nProvider>
        <DeliverablesList
          deliverables={mockDeliverables}
          selectedDepartment={null}
          onSelectDepartment={onSelectDeptMock}
          onOpenFile={vi.fn()}
          orgData={mockOrgData}
        />
      </I18nProvider>
    );

    const secretaryBtn = screen.getByRole('button', { name: 'Secretary' });
    fireEvent.click(secretaryBtn);

    expect(onSelectDeptMock).toHaveBeenCalledTimes(1);
    expect(onSelectDeptMock).toHaveBeenCalledWith('秘書室');
  });

  it('honors custom short_name from orgData when defined', () => {
    localStorage.setItem('agy_company_language', 'ja');

    const customOrgData: OrgChartData = {
      ...mockOrgData,
      departments: [
        {
          id: 'engineering',
          name: '次世代開発推進部門 (Engineering Innovation)',
          short_name: '開発',
          role: '開発',
          deliverables_count: 1,
          path: '01_Inbox/engineering'
        }
      ]
    };

    render(
      <I18nProvider>
        <DeliverablesList
          deliverables={mockDeliverables}
          selectedDepartment={null}
          onSelectDepartment={vi.fn()}
          onOpenFile={vi.fn()}
          orgData={customOrgData}
        />
      </I18nProvider>
    );

    // Should prioritize explicit short_name '開発'
    expect(screen.getByRole('button', { name: '開発' })).toBeInTheDocument();
  });
});
