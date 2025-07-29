import axios from 'axios';
import type { ColumnName } from './attributes';

export const fetchPages = async (page: number): Promise<{ data: ColumnName[]; total: number }> => {
  const res = await axios.get(`https://api.artic.edu/api/v1/artworks?page=${page}`);
  return {
    data: res.data.data,
    total: res.data.pagination.total
  };
};