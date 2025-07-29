import { useEffect, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Paginator } from 'primereact/paginator';

import type { ColumnName } from '../attributes';
import { fetchPages } from '../api';

export default function Tables() {
    const [data, setData] = useState<ColumnName[]>([]);
    const [page, setPage] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [loading, setLoading] = useState(false);
    const [selectedRows, setSelectedRows] = useState<ColumnName[]>([]);

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

    return (
        <div className="p-4">
            <DataTable
                value={data}
                loading={loading}
                selection={selectedRows}
                onSelectionChange={(e) => setSelectedRows(e.value)}
                dataKey="id"
                header="ColumnNames Table"
                paginator={false}
                selectionMode="multiple"
            >
                <Column selectionMode="multiple" style={{ width: '3rem' }} />
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