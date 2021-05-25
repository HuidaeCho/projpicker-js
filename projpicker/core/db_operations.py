def query_auth_code(cursor, id):

    sql = f"""
           SELECT auth_code FROM codes WHERE id = {id}
           """
    cursor.execute(sql)
    return cursor.fetchall()[0][0]


def query_id(cursor, auth_code):
    sql = f"""
           SELECT id FROM codes WHERE auth_code = {auth_code}
           """
    cursor.execute(sql)
    return cursor.fetchall()[0][0]


def authority_codes(cursor, auth="EPSG", table="projected_crs") -> list:
    """
    Get list of authority_codes
    """
    cursor.execute(f"SELECT code, deprecated FROM {table} WHERE auth_name = '{auth}'")
    return [str(code[0]) for code in cursor.fetchall() if code[1] == 0]


def usage_codes(cursor, auth_code) -> dict:
    """
    Get extent and scope keys from usage table
    """
    cursor.execute(
        f"SELECT extent_code, scope_code FROM usage WHERE object_code = {auth_code}"
    )

    codes = cursor.fetchall()[0]
    codes_dict = {"extent_code": codes[0], "scope_code": codes[1]}

    return codes_dict


def usage_index(cursor, auth_codes) -> dict:
    """
    Create full dictionary of CRS codes and their respective usage codes.
    """
    codex = {}
    for code in auth_codes:
        codex[code] = usage_codes(cursor, code)
    return codex


def get_scope(cursor, code: dict, auth="EPSG") -> list:
    """
    Retrieve scope from CRS code usage index
    """
    scope_code = code["scope_code"]
    sql = f"""SELECT scope FROM scope
              WHERE code = {scope_code}"""
    cursor.execute(sql)
    return list(cursor.fetchall()[0])


def get_extent(cursor, code: dict, auth="EPSG") -> dict:
    """
    Retrieve extent from CRS code usage index
    """
    extent_code = code["extent_code"]
    sql = f"""SELECT name, description FROM extent
              WHERE code = {extent_code}"""
    cursor.execute(sql)
    area = cursor.fetchall()[0]
    extent = {"name": area[0], "description": area[1]}

    sql = f"""SELECT south_lat, west_lon, north_lat, east_lon FROM extent
              WHERE auth_name = '{auth}'
              AND code = {extent_code}"""
    cursor.execute(sql)
    bbox = list(cursor.fetchall()[0])
    bbox_round = list(map(lambda x: round(x, ndigits=2), bbox))
    extent['bbox'] = bbox_round
    return extent


def pop_usage_index(cursor, code: dict, auth="EPSG") -> dict:
    """
    Populate individual usage entry
    """
    scope = get_scope(cursor, code, auth)
    extent = get_extent(cursor, code, auth)
    return {"scope": scope, "area": extent}


def get_usage_dict(cursor, code_idx) -> dict:
    """
    Generate full populated usage dictionary for list of CRS.
    """
    usage = {}
    for code in code_idx:
        usage[code] = pop_usage_index(cursor, code_idx[str(code)])

    return usage


def crs_usage(cursor, auth="EPSG", table="projected_crs") -> dict:
    """
    Generate a full usage dictionary for a specified CRS.
    """
    auth_codes = authority_codes(cursor, auth, table)
    usage_idx = usage_index(cursor, auth_codes)
    usage_dict = get_usage_dict(cursor, usage_idx)

    return usage_dict

