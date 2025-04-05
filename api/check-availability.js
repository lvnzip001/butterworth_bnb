// This API route checks the availability of a specific BnB for a given date range
// and returns the available room types and their prices.
import supabase from './supabase-server'

export default async (req, res) => {
  const { bnbId, startDate, endDate } = req.body

  const { data, error } = await supabase.rpc('check_availability', {
    p_bnb_id: bnbId,
    p_start_date: startDate,
    p_end_date: endDate
  })

  if (error) return res.status(500).json({ error })
  res.status(200).json(data)
}