import csv, io, re
import pandas as pd

def load_messy(path):
    """Đọc file CSV nhiều đoạn (mỗi đoạn có tiêu đề riêng), chịu lỗi dấu phẩy/xuống dòng.
    Trả về (df_có_sao, danh_sách_dòng_mồ_côi, log)."""
    raw = open(path, encoding="utf-8-sig", newline="").read().replace("\r\n", "\n").replace("\r", "\n")
    lines = raw.split("\n")
    head_re = re.compile(r"^(?:[^,\"]*,)*product_id,rating(?:,|$)")
    heads = [i for i, l in enumerate(lines) if head_re.match(l)]
    bounds = heads + [len(lines)]
    recs, orphans, log = [], [], {"broken": 0, "rescued": 0}
    for a, b in zip(bounds[:-1], bounds[1:]):
        hdr = next(csv.reader([lines[a]]))
        ipid, irat, ic = hdr.index("product_id"), hdr.index("rating"), hdr.index("comment")
        tail = len(hdr) - ic - 1
        start_re = re.compile(r"^(?:[^,\"]*,){%d}\d{4,},[1-5]," % ipid)
        buf = None
        def finish(buf):
            fields = next(csv.reader(io.StringIO(buf)), [])
            if len(fields) > len(hdr):          # dấu phẩy không bọc ngoặc trong comment
                head = fields[:ic]
                t = fields[len(fields) - tail:] if tail else []
                fields = head + [",".join(fields[ic:len(fields) - tail] if tail else fields[ic:])] + t
                log["rescued"] += 1
            if len(fields) != len(hdr):
                log["broken"] += 1
                return
            r = dict(zip(hdr, fields)); r["segment"] = a + 1
            recs.append(r)
        for line in lines[a + 1:b]:
            if buf is None:
                if start_re.match(line):
                    buf = line
                else:
                    if line.strip(): orphans.append(line.strip())
                    continue
            else:
                if start_re.match(line):        # bản ghi trước bị hỏng dở
                    log["broken"] += 1
                    buf = line
                else:
                    buf += "\n" + line
            if buf.count('"') % 2 == 0:
                finish(buf); buf = None
        if buf is not None: log["broken"] += 1
    df = pd.DataFrame(recs)
    df["rating"] = pd.to_numeric(df["rating"], errors="coerce")
    return df, orphans, log
