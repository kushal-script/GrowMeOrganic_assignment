import { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Checkbox } from 'primereact/checkbox';
import type { ColumnName } from '../attributes';
import { fetchPages } from '../api';

export default function Tables() {
    const [data, setData] = useState<ColumnName[]>([]);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<ColumnName[]>([]);
    const [selectCount, setSelectCount] = useState<number | null>(null);

    const perPage = 12;
    const opRef = useRef<OverlayPanel>(null);

    const getData = async () => {
        setLoading(true);
        const res = await fetchPages(page);
        setData(res.data);
        setTotalRecords(res.total);
        setLoading(false);
    };

    useEffect(() => {
        getData();
    }, [page]);

    const handleSelectCount = async () => {
        if (!selectCount || selectCount <= 0) return;

        let remaining = selectCount;
        let newSelected: ColumnName[] = [];

        let currentPage = page;

        while (remaining > 0) {
            const res = await fetchPages(currentPage);
            const pageData = res.data;

            const toSelect = pageData.slice(0, remaining);
            newSelected = [...newSelected, ...toSelect];
            remaining -= toSelect.length;

            if (remaining > 0 && (currentPage * perPage) < res.total) {
                currentPage++;
            } else {
                break;
            }
        }

        setSelectedRows(newSelected);
        opRef.current?.hide();
    };

    const headerCheckboxTemplate = () => {
        const allSelected = data.length > 0 && data.every(row => selectedRows.some(s => s.id === row.id));
        return (
            <div className="flex items-center gap-2 relative">
                <Checkbox
                    inputId="header-checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                        if (e.checked) {
                            setSelectedRows(data);
                        } else {
                            setSelectedRows([]);
                        }
                    }}
                />
                <i
                    className="pi pi-angle-down cursor-pointer"
                    onClick={(e) => opRef.current?.toggle(e)}
                    title="Select N items"
                />
                <OverlayPanel ref={opRef} showCloseIcon className="p-3">
                    <div className="flex flex-col gap-2">
                        <InputNumber
                            value={selectCount}
                            onValueChange={(e) => setSelectCount(e.value ?? null)}
                            placeholder="Enter number"
                            min={1}
                        />
                        <Button label="Select" onClick={handleSelectCount} />
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
                onSelectionChange={(e) => setSelectedRows(e.value as ColumnName[])}
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