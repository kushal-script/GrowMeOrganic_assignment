import { useEffect, useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import type { DataTableSelectEvent, DataTableUnselectEvent } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';
import { OverlayPanel } from 'primereact/overlaypanel';
import { Checkbox } from 'primereact/checkbox';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import { Badge } from 'primereact/badge';

import type { ColumnName } from '../attributes';
import { fetchPages } from '../api';

interface RowState {
    [id: number]: boolean;
}

export default function Tables() {
    const [data, setData] = useState<ColumnName[]>([]);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<RowState>({});
    const [selectCount, setSelectCount] = useState<number | null>(null);
    const overlayRef = useRef<OverlayPanel>(null);

    const perPage = 12;

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

    const handleRowSelect = (e: DataTableSelectEvent) => {
        setSelectedRows(prev => ({ ...prev, [e.data.id]: true }));
    };

    const handleRowUnselect = (e: DataTableUnselectEvent) => {
        setSelectedRows(prev => {
            const updated = { ...prev };
            delete updated[e.data.id];
            return updated;
        });
    };

    const handleCustomSelect = async () => {
        if (selectCount === null) return;

        const currentCount = Object.keys(selectedRows).length;
        if (currentCount >= selectCount) {
            overlayRef.current?.hide();
            return;
        }

        const newSelection: RowState = { ...selectedRows };
        let tempPage = 1;

        while (Object.keys(newSelection).length < selectCount) {
            const res = await fetchPages(tempPage);
            const rows = res.data;

            for (const row of rows) {
                if (!(row.id in newSelection)) {
                    newSelection[row.id] = true;
                    if (Object.keys(newSelection).length === selectCount) break;
                }
            }

            if (rows.length === 0 || tempPage * perPage >= res.total) break;
            tempPage++;
        }

        setSelectedRows(newSelection);
        overlayRef.current?.hide();
    };

    const isSelected = (row: ColumnName) => !!selectedRows[row.id];
    const isDisabled = (row: ColumnName) => {
        return (
            !isSelected(row) &&
            selectCount !== null &&
            Object.keys(selectedRows).length >= selectCount
        );
    };

    const clearAll = () => {
        setSelectedRows({});
    };

    const headerCheckbox = (
        <div className="flex flex-row space-x-2">
            <Checkbox
                checked={data.length > 0 && data.every(row => isSelected(row))}
                onChange={(e) => {
                    const checked = e.checked;
                    const updated = { ...selectedRows };
                    data.forEach(row => {
                        if (checked && !isDisabled(row)) updated[row.id] = true;
                        else delete updated[row.id];
                    });
                    setSelectedRows(updated);
                }}
            />
            <i
                className="pi pi-chevron-down text-gray-600 text-sm cursor-pointer"
                onClick={(e) => overlayRef.current?.toggle(e)}
            />
            <OverlayPanel ref={overlayRef} dismissable>
                <div className="p-2 w-56">
                    <InputNumber
                        value={selectCount ?? undefined}
                        onValueChange={(e) => {
                            const val = e.value;
                            setSelectCount(typeof val === 'number' ? val : null);
                        }}
                        useGrouping={false}
                        min={1}
                        placeholder="Enter row count"
                        className="w-full mb-2"
                    />
                    <Button
                        label="Submit"
                        onClick={handleCustomSelect}
                        disabled={selectCount === null || selectCount <= Object.keys(selectedRows).length}
                        className="w-full mb-2"
                    />
                    <Button label="Clear All" severity="secondary" onClick={clearAll} className="w-full" />
                </div>
            </OverlayPanel>
            <Badge value={Object.keys(selectedRows).length} severity="info" className="ml-2" />
        </div>
    );

    return (
        <div className="p-4">
            <DataTable
                value={data}
                loading={loading}
                selection={data.filter(row => isSelected(row))}
                onRowSelect={handleRowSelect}
                onRowUnselect={handleRowUnselect}
                dataKey="id"
                header="ColumnNames Table"
                paginator={false}
                selectionMode={'multiple'}
            >
                <Column
                    header={headerCheckbox}
                    style={{ width: '3rem' }}
                    body={(row) => (
                        <Checkbox
                            checked={isSelected(row)}
                            disabled={isDisabled(row)}
                            onChange={(e) => {
                                const checked = e.checked;
                                if (checked && !isDisabled(row)) {
                                    setSelectedRows(prev => ({ ...prev, [row.id]: true }));
                                } else {
                                    setSelectedRows(prev => {
                                        const updated = { ...prev };
                                        delete updated[row.id];
                                        return updated;
                                    });
                                }
                            }}
                        />
                    )}
                />
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
