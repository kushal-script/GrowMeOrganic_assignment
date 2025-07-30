import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { ColumnName } from '../attributes';
import { fetchPages } from '../api';

export default function Tables() {
    const [data, setData] = useState<ColumnName[]>([]);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectCount, setSelectCount] = useState<number | null>(null);
    const [bulkLoading, setBulkLoading] = useState(false);

    const perPage = 12;

    const opRef = useRef<OverlayPanel>(null);
    const pageCache = useRef<Record<number, ColumnName[]>>({});

    // Persistent selection map
    const persistentSelection = useRef<Map<string, ColumnName>>(new Map());

    // Get current page's selected rows from persistent map
    const getPageSelections = (pageData: ColumnName[]) => {
        return pageData.filter((row) => persistentSelection.current.has(row.id.toString()));
    };

    const [selectedRows, setSelectedRows] = useState<ColumnName[]>([]);

    // Initial data load or page change
    const getData = async () => {
        setLoading(true);
        const res = await fetchPages(page);
        setData(res.data);
        pageCache.current[page] = res.data;
        setTotalRecords(res.total);
        setSelectedRows(getPageSelections(res.data));
        setLoading(false);
    };

    useEffect(() => {
        getData();
    }, [page]);

    // Selection handler for current page
    const handleSelectionChange = (e: { value: ColumnName[] }) => {
        const selected = e.value;
        const pageData = pageCache.current[page] ?? [];

        // Updating persistent map
        pageData.forEach((row) => {
            if (selected.find((s) => s.id === row.id)) {
                persistentSelection.current.set(row.id.toString(), row);
            } else {
                persistentSelection.current.delete(row.id.toString());
            }
        });

        setSelectedRows(selected);
    };

    // Bulk selection logic
    const handleSelectCount = async () => {
        if (!selectCount || selectCount <= 0) return;

        const count = selectCount;
        const startPage = page;
        const totalPages = Math.ceil(totalRecords / perPage);
        const pagesToFetch: number[] = [];

        let remaining = count;
        let currentPage = startPage;

        while (remaining > 0 && currentPage <= totalPages) {
            if (!pageCache.current[currentPage]) {
                pagesToFetch.push(currentPage);
            }
            remaining -= perPage;
            currentPage++;
        }

        setBulkLoading(true);

        // Parallel fetch for missing pages
        await Promise.all(
            pagesToFetch.map(async (p) => {
                const res = await fetchPages(p);
                pageCache.current[p] = res.data;
            })
        );

        // Selection logic
        const allSelected: ColumnName[] = [];
        let toSelect = count;
        currentPage = startPage;

        while (toSelect > 0 && currentPage <= totalPages) {
            const pageData = pageCache.current[currentPage] ?? [];
            for (const item of pageData) {
                if (!persistentSelection.current.has(item.id.toString())) {
                    persistentSelection.current.set(item.id.toString(), item);
                    allSelected.push(item);
                    toSelect--;
                    if (toSelect === 0) break;
                }
            }
            currentPage++;
        }

        setSelectedRows(getPageSelections(data));
        setBulkLoading(false);
        opRef.current?.hide();
    };

    const handleClearSelection = () => {
        persistentSelection.current.clear();
        setSelectedRows([]);
        opRef.current?.hide();
    };

    // Bulk selection template
    const headerCheckboxTemplate = () => {
        return (
            <div className="flex items-center gap-2 mr-10 relative">
                <i
                    className="pi pi-angle-down cursor-pointer"
                    onClick={(e) => opRef.current?.toggle(e)}
                    title="Select N items"
                />
                <OverlayPanel ref={opRef} showCloseIcon className="p-3">
                    <div className="flex flex-col gap-2 min-w-[200px]">
                        <InputNumber
                            value={selectCount}
                            onChange={(e) => setSelectCount(e.value ?? null)}
                            placeholder="Enter number"
                            min={0}
                            useGrouping={false}
                        />
                        <Button
                            label={
                                bulkLoading
                                    ? 'Selecting...'
                                    : selectCount === 0
                                        ? 'Clear Selection'
                                        : selectCount == null
                                            ? 'Select items'
                                            : `Select ${selectCount} items`
                            }
                            onClick={() => {
                                if (selectCount === 0) {
                                    handleClearSelection();
                                } else {
                                    handleSelectCount();
                                }
                            }}
                            disabled={bulkLoading || selectCount == null}
                        />
                    </div>
                </OverlayPanel>
            </div>
        );
    };

    return (
        <div className="p-4">
            <DataTable
                value={data}
                loading={loading}
                selection={selectedRows}
                onSelectionChange={handleSelectionChange}
                dataKey="id"
                header="BOOKS"
                paginator={false}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" header={headerCheckboxTemplate} style={{ width: '4rem' }} />
                <Column field="title" header="Title" />
                <Column field="place_of_origin" header="Origin" />
                <Column field="artist_display" header="Artist" />
                <Column field="inscriptions" header="Inscriptions" />
                <Column field="date_start" header="Start Date" />
                <Column field="date_end" header="End Date" />
            </DataTable>

            <Paginator
                first={(page - 1) * perPage}
                rows={perPage}
                totalRecords={totalRecords}
                onPageChange={(e) => setPage(e.page + 1)}
                className="mt-3"
            />
        </div>
    );
}
